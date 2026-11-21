import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  BENEFICIARY_IMPORT_FIELDS,
  type BeneficiaryImportField,
  type BeneficiaryImportRow,
  parseBeneficiaryImportRow,
  LIMITS,
} from '../common/shared';
import { AuditService } from '../audit/audit.service';
import { hashNationalId } from '../common/utils/national-id';
import type { AuthUser } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { detectKind, readTable, type Table, toCsv } from './table-reader';

export type ColumnMapping = Partial<Record<BeneficiaryImportField, string>>;

export interface RowError {
  row: number;
  field: string;
  message: string;
}

interface ValidatedRow {
  row: number;
  data: BeneficiaryImportRow;
  nationalIdHash: string | null;
  nationalIdLast4: string | null;
}

interface ValidationResult {
  totalRows: number;
  valid: ValidatedRow[];
  errors: RowError[];
  duplicates: { row: number; reason: 'in_file' | 'in_database' }[];
}

/** FR-26: استيراد المستفيدين من Excel/CSV — معاينة ← مطابقة الأعمدة ← dry run ← حفظ. */
@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async preview(file: Express.Multer.File | undefined, actor: AuthUser) {
    if (!file) throw new BadRequestException('file_required');
    if (file.size > LIMITS.maxImportBytes) throw new BadRequestException('file_too_large');
    const kind = detectKind(file.originalname, file.buffer);
    const table = await readTable(file.buffer, kind);
    const storageKey = await this.storage.saveRaw(file.buffer, kind, 'imports');
    const job = await this.prisma.importJob.create({
      data: {
        kind: 'BENEFICIARIES',
        fileName: file.originalname,
        storageKey,
        totalRows: table.rows.length,
        createdById: actor.id,
      },
    });
    return {
      jobId: job.id,
      fileName: job.fileName,
      totalRows: table.rows.length,
      headers: table.headers,
      sampleRows: table.rows.slice(0, 20),
      fields: Object.keys(BENEFICIARY_IMPORT_FIELDS),
      suggestedMapping: suggestMapping(table.headers),
    };
  }

  async validate(jobId: string, mapping: ColumnMapping) {
    const { job, table } = await this.load(jobId);
    const result = await this.run(table, mapping);
    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        mapping,
        validRows: result.valid.length,
        errorRows: result.totalRows - result.valid.length,
        errors: [
          ...result.errors,
          ...result.duplicates.map((d) => ({
            row: d.row,
            field: '*',
            message: `duplicate_${d.reason}`,
          })),
        ] as unknown as Prisma.InputJsonValue,
      },
    });
    return {
      jobId: job.id,
      totalRows: result.totalRows,
      validRows: result.valid.length,
      errorRows: new Set(result.errors.map((e) => e.row)).size,
      duplicateRows: result.duplicates.length,
      errors: result.errors.slice(0, 50),
      duplicates: result.duplicates.slice(0, 50),
    };
  }

  async commit(jobId: string, actor: AuthUser) {
    const { job, table } = await this.load(jobId);
    const mapping = (job.mapping ?? {}) as ColumnMapping;
    if (!mapping.fullName) throw new BadRequestException('validate_first');
    const result = await this.run(table, mapping);

    const created = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.beneficiary.createMany({
        data: result.valid.map((r) => ({
          fullName: r.data.fullName,
          phone: r.data.phone ?? null,
          nationalIdHash: r.nationalIdHash,
          nationalIdLast4: r.nationalIdLast4,
          localCouncil: r.data.localCouncil ?? null,
          otherPrograms: r.data.otherPrograms,
          importJobId: job.id,
        })),
      });
      await tx.importJob.update({
        where: { id: job.id },
        data: { status: 'COMMITTED', committedAt: new Date(), validRows: count },
      });
      await this.audit.log(
        {
          actorId: actor.id,
          action: 'import.commit',
          entityType: 'ImportJob',
          entityId: job.id,
          after: { created: count, skipped: result.totalRows - count },
        },
        tx,
      );
      return count;
    });
    return { jobId: job.id, created, skipped: result.totalRows - created };
  }

  /** الصفوف المرفوضة مع السبب، لتصحيحها وإعادة رفعها. */
  async errorsCsv(jobId: string): Promise<string> {
    const { job, table } = await this.load(jobId, true);
    const errors = (job.errors ?? []) as unknown as RowError[];
    const byRow = new Map<number, string[]>();
    for (const e of errors)
      byRow.set(e.row, [...(byRow.get(e.row) ?? []), `${e.field}: ${e.message}`]);
    const lines: string[][] = [['row', ...table.headers, 'errors']];
    for (const [row, messages] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
      lines.push([String(row), ...(table.rows[row - 2] ?? []), messages.join(' | ')]);
    }
    return toCsv(lines);
  }

  private async load(jobId: string, allowCommitted = false) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job?.storageKey) throw new NotFoundException('import_not_found');
    if (job.status === 'COMMITTED' && !allowCommitted)
      throw new ConflictException('already_committed');
    const data = await this.storage.read(job.storageKey);
    const table = await readTable(data, job.storageKey.endsWith('.xlsx') ? 'xlsx' : 'csv');
    return { job, table };
  }

  private async run(table: Table, mapping: ColumnMapping): Promise<ValidationResult> {
    if (!mapping.fullName) throw new BadRequestException('mapping_requires_fullName');
    const index = new Map(table.headers.map((h, i) => [h, i]));
    for (const column of Object.values(mapping)) {
      if (column && !index.has(column))
        throw new BadRequestException(`unknown_column:${column}`);
    }
    const key = this.config.getOrThrow<string>('NATIONAL_ID_HMAC_KEY');
    const errors: RowError[] = [];
    const candidates: ValidatedRow[] = [];

    table.rows.forEach((cells, i) => {
      const rowNo = i + 2; // +1 للعناوين، +1 لأن Excel يبدأ من 1
      const raw: Partial<Record<BeneficiaryImportField, string>> = {};
      for (const [field, column] of Object.entries(mapping) as [
        BeneficiaryImportField,
        string | undefined,
      ][]) {
        const value = column ? cells[index.get(column) ?? -1] : undefined;
        raw[field] = value === '' ? undefined : value;
      }
      const parsed = parseBeneficiaryImportRow(raw);
      if (!parsed.ok) {
        for (const issue of parsed.issues) {
          errors.push({ row: rowNo, field: issue.field, message: issue.message });
        }
        return;
      }
      const nid = parsed.data.nationalId ? hashNationalId(parsed.data.nationalId, key) : null;
      candidates.push({
        row: rowNo,
        data: parsed.data,
        nationalIdHash: nid?.hash ?? null,
        nationalIdLast4: nid?.last4 ?? null,
      });
    });

    // التكرار داخل الملف ومع قاعدة البيانات (بالرقم الوطني أو الهاتف)
    const duplicates: ValidationResult['duplicates'] = [];
    const seen = new Set<string>();
    const hashes = candidates.map((c) => c.nationalIdHash).filter((h): h is string => !!h);
    const phones = candidates.map((c) => c.data.phone).filter((p): p is string => !!p);
    const existing = await this.prisma.beneficiary.findMany({
      where: { OR: [{ nationalIdHash: { in: hashes } }, { phone: { in: phones } }] },
      select: { nationalIdHash: true, phone: true },
    });
    const existingKeys = new Set(
      existing.flatMap((e) => [e.nationalIdHash, e.phone].filter((v): v is string => !!v)),
    );

    const valid: ValidatedRow[] = [];
    for (const c of candidates) {
      const keys = [c.nationalIdHash, c.data.phone].filter((v): v is string => !!v);
      if (keys.some((k) => existingKeys.has(k))) {
        duplicates.push({ row: c.row, reason: 'in_database' });
      } else if (keys.some((k) => seen.has(k))) {
        duplicates.push({ row: c.row, reason: 'in_file' });
      } else {
        keys.forEach((k) => seen.add(k));
        valid.push(c);
      }
    }
    return { totalRows: table.rows.length, valid, errors, duplicates };
  }
}

/** يقترح مطابقة الأعمدة من أسماء شائعة بالعربية والإنكليزية. */
export function suggestMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, ' ');
  const mapping: ColumnMapping = {};
  for (const [field, aliases] of Object.entries(BENEFICIARY_IMPORT_FIELDS) as [
    BeneficiaryImportField,
    readonly string[],
  ][]) {
    const match = headers.find((h) => aliases.some((a) => normalize(a) === normalize(h)));
    if (match) mapping[field] = match;
  }
  return mapping;
}
