import { normalizePhone, toLatinDigits } from './utils';

/** Columns an Excel/CSV import can map to, with common header names used to suggest the mapping. */
export const BENEFICIARY_IMPORT_FIELDS = {
  fullName: ['الاسم', 'الاسم الكامل', 'اسم المستفيد', 'name', 'full name', 'fullname'],
  phone: ['الهاتف', 'الموبايل', 'رقم الهاتف', 'الجوال', 'phone', 'mobile'],
  nationalId: ['الرقم الوطني', 'رقم الهوية', 'national id', 'nationalid', 'id number'],
  localCouncil: ['المجلس', 'المجلس المحلي', 'المنطقة', 'council', 'local council'],
  otherPrograms: ['البرامج', 'برامج أخرى', 'المساعدات', 'programs', 'other programs'],
} as const;
export type BeneficiaryImportField = keyof typeof BENEFICIARY_IMPORT_FIELDS;

/** One beneficiary row after the column mapping has been applied and validated. */
export interface BeneficiaryImportRow {
  fullName: string;
  phone?: string;
  nationalId?: string;
  localCouncil?: string;
  otherPrograms: string[];
}

export interface BeneficiaryImportIssue {
  field: BeneficiaryImportField;
  message: string;
}

export type BeneficiaryImportParseResult =
  { ok: true; data: BeneficiaryImportRow } | { ok: false; issues: BeneficiaryImportIssue[] };

/** Validates and normalises one raw import row (hand-written; the API does not use zod). */
export function parseBeneficiaryImportRow(
  raw: Partial<Record<BeneficiaryImportField, string>>,
): BeneficiaryImportParseResult {
  const issues: BeneficiaryImportIssue[] = [];

  const fullName = (raw.fullName ?? '').trim();
  if (fullName.length < 3) issues.push({ field: 'fullName', message: 'name_too_short' });
  else if (fullName.length > 120) issues.push({ field: 'fullName', message: 'name_too_long' });

  let phone: string | undefined;
  if (raw.phone !== undefined) {
    const normalized = normalizePhone(raw.phone.trim());
    if (normalized) phone = normalized;
    else issues.push({ field: 'phone', message: 'invalid_phone' });
  }

  let nationalId: string | undefined;
  if (raw.nationalId !== undefined) {
    nationalId = toLatinDigits(raw.nationalId.trim()).replace(/\s/g, '');
    if (nationalId !== '' && !/^\d{6,15}$/.test(nationalId)) {
      issues.push({ field: 'nationalId', message: 'invalid_national_id' });
    }
  }

  const localCouncil = raw.localCouncil?.trim();
  if (localCouncil !== undefined && localCouncil.length > 80) {
    issues.push({ field: 'localCouncil', message: 'local_council_too_long' });
  }

  const otherPrograms = raw.otherPrograms
    ? raw.otherPrograms
        .split(/[,،;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, data: { fullName, phone, nationalId, localCouncil, otherPrograms } };
}
