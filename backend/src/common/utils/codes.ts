import { randomInt } from 'node:crypto';

// بدون أحرف ملتبسة (0/O, 1/I) لتسهيل قراءتها على الهاتف
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET.charAt(randomInt(ALPHABET.length));
  return out;
}

/** رقم تتبع الحالة: MF-2026-7K3QX */
export function newTrackingNo(now = new Date()): string {
  return `MF-${now.getFullYear()}-${randomCode(5)}`;
}

/** رقم مرجع التعهد: P-8F2KD9 */
export function newPledgeRef(): string {
  return `P-${randomCode(6)}`;
}

/** رقم الإيصال الرسمي: R-2026-000123 (متسلسل). */
export function officialReceiptNo(sequence: number, now = new Date()): string {
  return `R-${now.getFullYear()}-${String(sequence).padStart(6, '0')}`;
}

/** slug للحملة: لاتيني + لاحقة عشوائية (العناوين عربية غالباً). */
export function newCampaignSlug(prefix: string): string {
  const clean = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `${clean || 'case'}-${randomCode(5).toLowerCase()}`;
}

/** Donor code: D-7K3QX9. The donor's own reference on receipts and «تبرعاتي» (never a phone or name). */
export function newDonorCode(): string {
  return `D-${randomCode(6)}`;
}

/** Public beneficiary code: B-7K3Q. The only beneficiary identifier ever shown publicly. */
export function newBeneficiaryCode(): string {
  return `B-${randomCode(4)}`;
}
