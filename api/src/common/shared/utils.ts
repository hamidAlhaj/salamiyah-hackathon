const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** يحوّل الأرقام العربية/الفارسية إلى لاتينية: «٠٩٤» ← «094». */
export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : PERSIAN.indexOf(ch));
  });
}

/**
 * تطبيع رقم هاتف سوري إلى الصيغة الدولية +9639XXXXXXXX.
 * يقبل: 0944123456، 944123456، 00963944123456، +963 944 123 456، وبأرقام عربية.
 * يرجع null إذا لم يكن رقماً سورياً صالحاً. أرقام دولية أخرى (مغتربون) تُقبل بصيغة +XXXXXXXX.
 */
export function normalizePhone(raw: string): string | null {
  const digits = toLatinDigits(raw).replace(/[\s\-().]/g, '');
  let d = digits;
  if (d.startsWith('00')) d = `+${d.slice(2)}`;
  if (d.startsWith('+963')) d = d.slice(4);
  else if (d.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(d) ? d : null;
  if (d.startsWith('0')) d = d.slice(1);
  return /^9\d{8}$/.test(d) ? `+963${d}` : null;
}

/** آخر 4 أرقام من الهاتف (لتتبع الطلب دون كشف الرقم). */
export function phoneLast4(phone: string): string {
  return phone.slice(-4);
}

/** تنسيق مبلغ حسب اللغة والعملة. amount نص عشري (Decimal من الـAPI). */
export function formatMoney(
  amount: string | number,
  currency: 'SYP' | 'USD',
  locale: 'ar' | 'en',
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'SYP' ? 0 : 2,
  }).format(value);
}

/** نسبة التقدم 0..100 (مقربة لأسفل). */
export function progressPercent(raised: string | number, target: string | number): number {
  const r = Number(raised);
  const t = Number(target);
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.min(100, Math.floor((r / t) * 100));
}

/** رابط مشاركة واتساب برسالة جاهزة (بدون WhatsApp API). */
export function whatsappShareUrl(text: string, phone?: string): string {
  const base = phone ? `https://wa.me/${phone.replace(/^\+/, '')}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
