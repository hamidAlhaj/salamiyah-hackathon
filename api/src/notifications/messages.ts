import type { Currency, PaymentMethod, Priority } from '@prisma/client';
import { formatMoney } from '../common/shared';
import type { DonationEventType } from '../pledges/donation-events';

type Lang = 'ar' | 'en';

/** What a donation message may mention: the pledge, never a beneficiary's identity. */
export interface DonationContext {
  referenceNo: string;
  amount: string;
  currency: Currency;
  method: PaymentMethod;
  campaignTitle: string;
  collectionPoint: { name: string; area: string } | null;
  officialReceiptNo: string | null;
  reason?: string;
}

export interface MessageText {
  title: string;
  body: string;
}

const METHODS: Record<Lang, Record<PaymentMethod, string>> = {
  ar: {
    BEMO_TRANSFER: 'حوالة بنك بيمو',
    BANK_TRANSFER: 'حوالة مصرفية',
    SHAM_CASH: 'شام كاش',
    SYRIATEL_CASH: 'سيريتل كاش',
    MTN_CASH: 'MTN كاش',
    PAYPAL: 'PayPal',
    VISA: 'Visa',
    CASH: 'نقداً',
  },
  en: {
    BEMO_TRANSFER: 'Bemo bank transfer',
    BANK_TRANSFER: 'bank transfer',
    SHAM_CASH: 'ShamCash',
    SYRIATEL_CASH: 'Syriatel Cash',
    MTN_CASH: 'MTN Cash',
    PAYPAL: 'PayPal',
    VISA: 'Visa',
    CASH: 'cash',
  },
};

/** The in-app title and body for one donation event, in the donor's language (Western digits). */
export function donationMessage(
  type: DonationEventType,
  c: DonationContext,
  lang: Lang,
): MessageText {
  const amount = formatMoney(c.amount, c.currency, lang);
  const method = METHODS[lang][c.method];
  const ar = lang === 'ar';
  switch (type) {
    case 'pledge.demo_confirmed':
      return ar
        ? {
            title: 'تم استلام تبرعك (تجريبي)',
            body: `استلمنا دفعتك التجريبية ${amount} عبر ${method} لحملة «${c.campaignTitle}». رقم المرجع ${c.referenceNo}. هذه محاكاة لعرض الهاكاثون ولا تدخل في المبالغ الحقيقية.`,
          }
        : {
            title: 'Donation received (demo)',
            body: `We received your demo payment of ${amount} via ${method} for “${c.campaignTitle}”. Reference ${c.referenceNo}. This is a hackathon simulation and never counts as real money.`,
          };
    case 'pledge.created':
      return ar
        ? {
            title: 'تم تسجيل تعهدك',
            body: `تعهدك بـ${amount} لحملة «${c.campaignTitle}» برقم المرجع ${c.referenceNo}. حوّل المبلغ واكتب الرقم في ملاحظة التحويل، ثم ارفع صورة الإيصال.`,
          }
        : {
            title: 'Pledge registered',
            body: `Your pledge of ${amount} for “${c.campaignTitle}” has reference ${c.referenceNo}. Transfer the amount with this reference in the note, then upload the receipt photo.`,
          };
    case 'pledge.receipt_uploaded':
      return ar
        ? {
            title: 'استلمنا إيصالك',
            body: `استلمنا إيصال تبرعك ${amount} لحملة «${c.campaignTitle}» (المرجع ${c.referenceNo}). هو الآن قيد التحقق المالي.`,
          }
        : {
            title: 'Receipt received',
            body: `We received the receipt for your ${amount} donation to “${c.campaignTitle}” (reference ${c.referenceNo}). It is now pending verification.`,
          };
    case 'pledge.cash_pledged': {
      const point = c.collectionPoint;
      return ar
        ? {
            title: 'تم تسجيل تبرعك النقدي',
            body: `سلّم ${amount} في «${point?.name ?? ''}» (${point?.area ?? ''}) واذكر رقم المرجع ${c.referenceNo} لمسؤول نقطة الجمع. الحملة: «${c.campaignTitle}».`,
          }
        : {
            title: 'Cash donation registered',
            body: `Hand over ${amount} at “${point?.name ?? ''}” (${point?.area ?? ''}) and tell the collector your reference ${c.referenceNo}. Campaign: “${c.campaignTitle}”.`,
          };
    }
    case 'pledge.cash_collected': {
      // An acknowledgement only: the official receipt comes after finance verification.
      const point = c.collectionPoint;
      return ar
        ? {
            title: 'استلمنا تبرعك النقدي',
            body: `سلّمت ${amount} في «${point?.name ?? ''}» لحملة «${c.campaignTitle}» (المرجع ${c.referenceNo}). هو الآن بانتظار التحقق المالي، ويصلك الإيصال الرسمي بعد التحقق.`,
          }
        : {
            title: 'Cash donation received',
            body: `You handed over ${amount} at “${point?.name ?? ''}” for “${c.campaignTitle}” (reference ${c.referenceNo}). It is now awaiting verification; your official receipt follows after verification.`,
          };
    }
    case 'pledge.verified':
      return ar
        ? {
            title: 'تم التحقق من تبرعك',
            body: `شكراً لك. تحقق المجلس من تبرعك ${amount} لحملة «${c.campaignTitle}».${c.officialReceiptNo ? ` رقم الإيصال الرسمي ${c.officialReceiptNo}.` : ''}`,
          }
        : {
            title: 'Donation verified',
            body: `Thank you. The council verified your ${amount} donation to “${c.campaignTitle}”.${c.officialReceiptNo ? ` Official receipt ${c.officialReceiptNo}.` : ''}`,
          };
    case 'pledge.rejected':
      return ar
        ? {
            title: 'لم نتمكن من التحقق من الإيصال',
            body: `تبرعك ${amount} لحملة «${c.campaignTitle}» (المرجع ${c.referenceNo}): ${c.reason ?? ''}. يمكنك رفع إيصال جديد من «تبرعاتي».`,
          }
        : {
            title: 'We could not verify the receipt',
            body: `Your ${amount} donation to “${c.campaignTitle}” (reference ${c.referenceNo}): ${c.reason ?? ''}. You can upload a new receipt from “My donations”.`,
          };
  }
}

/** The WhatsApp alert for an urgent campaign, sent to opted-in donors. */
export function urgentCampaignMessage(
  c: { title: string; priority: Priority; targetAmount: string; currency: Currency },
  lang: Lang,
): MessageText {
  const target = formatMoney(c.targetAmount, c.currency, lang);
  if (lang === 'ar') {
    const level = c.priority === 'VERY_URGENT' ? 'طارئة جداً' : 'عاجلة';
    return {
      title: `حملة ${level} تحتاج دعمك`,
      body: `نشر المجلس المحلي في السلمية حملة «${c.title}». الهدف ${target}.`,
    };
  }
  const level = c.priority === 'VERY_URGENT' ? 'critical' : 'urgent';
  return {
    title: `An ${level} campaign needs your support`,
    body: `The Salamiyah Local Council published “${c.title}”. Target ${target}.`,
  };
}

/** The WhatsApp text: title, body and the full link on its own line. */
export function whatsappText(text: MessageText, url: string): string {
  return `${text.title}\n${text.body}\n${url}`;
}
