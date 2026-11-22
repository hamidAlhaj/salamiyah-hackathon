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
