export const LIMITS = {
  /** حد رفع الإيصال/الوثيقة بعد الضغط (NFR-05). */
  maxUploadBytes: 5 * 1024 * 1024,
  /** حد ملف الاستيراد. */
  maxImportBytes: 10 * 1024 * 1024,
  maxImportRows: 5000,
  /** الهدف عند ضغط صورة الإيصال على الجهاز. */
  receiptTargetBytes: 500 * 1024,
  receiptMaxDimension: 1600,
  passwordMinLength: 8,
  pageSize: 12,
} as const;

export const ALLOWED_UPLOAD_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME)[number];

/** المدة الافتراضية قبل اعتبار الطلب متأخراً (FR-11). */
export const DEFAULT_SLA_DAYS = 7;

/**
 * The fixed icon set for campaign categories (CampaignCategory.icon). ADMIN picks one of these keys;
 * there are no icon uploads. Web and mobile map each key to a bundled icon.
 */
export const CATEGORY_ICONS = [
  'heart-pulse',
  'child',
  'home',
  'hands',
  'book',
  'basket',
  'water',
  'sun',
  'users',
  'star',
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

/**
 * Bundled campaign cover illustrations (Campaign.coverKey). Illustrations only, never photos of
 * beneficiaries; web and mobile ship one image per key.
 */
export const COVER_KEYS = [
  'medical-1',
  'medical-2',
  'orphans-1',
  'orphans-2',
  'home-1',
  'home-2',
  'community-1',
  'general-1',
] as const;
export type CoverKey = (typeof COVER_KEYS)[number];

/** WhatsApp outbox message kinds (OutboundMessage.template); the outbox screen filters by them. */
export const OUTBOX_TEMPLATES = [
  'donation.demo',
  'donation.pledged',
  'donation.received',
  'donation.cash',
  'donation.collected',
  'receipt.issued',
  'receipt.rejected',
  'campaign.urgent',
] as const;
export type OutboxTemplate = (typeof OUTBOX_TEMPLATES)[number];

/** The donor's choice when a donation exceeds a campaign's remaining need (docs/fund-contract.md). */
export const SURPLUS_CHOICES = ['SPLIT', 'REMAINING_ONLY'] as const;
export type SurplusChoice = (typeof SURPLUS_CHOICES)[number];

/** Slug of the general council fund («صندوق المجلس العام»), the one campaign with isGeneralFund. */
export const GENERAL_FUND_SLUG = 'general-fund';
