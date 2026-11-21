import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { LIMITS } from '../common/shared';

export interface Table {
  headers: string[];
  rows: string[][];
}

/** يقرأ أول ورقة من xlsx أو ملف csv إلى جدول نصوص. أول صف = العناوين. */
export async function readTable(data: Buffer, kind: 'xlsx' | 'csv'): Promise<Table> {
  const matrix =
    kind === 'xlsx' ? await readXlsx(data) : parseCsv(stripBom(data.toString('utf8')));
  const nonEmpty = matrix.filter((r) => r.some((c) => c.trim() !== ''));
  if (nonEmpty.length < 2) throw new BadRequestException('empty_file');
  const [headerRow, ...rows] = nonEmpty;
  const headers = (headerRow ?? []).map((h, i) => h.trim() || `column_${i + 1}`);
  if (rows.length > LIMITS.maxImportRows) throw new BadRequestException('too_many_rows');
  return { headers, rows: rows.map((r) => headers.map((_, i) => (r[i] ?? '').trim())) };
}

export function detectKind(fileName: string, data: Buffer): 'xlsx' | 'csv' {
  // xlsx = zip: يبدأ بـ PK\x03\x04
  if (
    data.length > 4 &&
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    data[2] === 0x03 &&
    data[3] === 0x04
  )
    return 'xlsx';
  if (/\.csv$/i.test(fileName) || /\.txt$/i.test(fileName)) return 'csv';
  throw new BadRequestException('unsupported_import_file');
}

async function readXlsx(data: Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new BadRequestException('empty_file');
  const out: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c += 1) cells.push(row.getCell(c).text ?? '');
    out.push(cells);
  });
  return out;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** CSV حسب RFC 4180 (علامات اقتباس، فواصل داخل الحقول، أسطر CRLF). يكتشف الفاصل ; أو , تلقائياً. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text.charAt(i + 1) === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const BOM = String.fromCharCode(0xfeff);

export function toCsv(rows: string[][]): string {
  const escape = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // BOM حتى يفتحه Excel بالعربية بشكل صحيح
  return `${BOM}${rows.map((r) => r.map(escape).join(',')).join('\r\n')}`;
}
