/**
 * Shared enums. Must match the Prisma enums in api/prisma/schema.prisma exactly,
 * and the copies in web/src/shared and mobile/src/shared.
 */

const values = <T extends Record<string, string>>(obj: T): [T[keyof T], ...T[keyof T][]] =>
  Object.values(obj) as [T[keyof T], ...T[keyof T][]];

export const Role = {
  DONOR: 'DONOR',
  CASE_OFFICER: 'CASE_OFFICER',
  FINANCE_VERIFIER: 'FINANCE_VERIFIER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  COLLECTOR: 'COLLECTOR',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const ROLES = values(Role);

export const Locale = { ar: 'ar', en: 'en' } as const;
export type Locale = (typeof Locale)[keyof typeof Locale];
export const LOCALES = values(Locale);

export const Currency = { SYP: 'SYP', USD: 'USD' } as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
export const CURRENCIES = values(Currency);

/** MEDICAL فقط حالياً (قرار المجلس). القيم المستقبلية تُضاف هنا وفي Prisma. */
export const CampaignType = { MEDICAL: 'MEDICAL' } as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];
export const CAMPAIGN_TYPES = values(CampaignType);

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  FUNDED: 'FUNDED',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];
export const CAMPAIGN_STATUSES = values(CampaignStatus);

export const CaseCategory = {
  SURGERY: 'SURGERY',
  MEDICATION: 'MEDICATION',
  INCUBATOR: 'INCUBATOR',
  ONCOLOGY: 'ONCOLOGY',
  TRANSPORT: 'TRANSPORT',
  OTHER: 'OTHER',
} as const;
export type CaseCategory = (typeof CaseCategory)[keyof typeof CaseCategory];
export const CASE_CATEGORIES = values(CaseCategory);

export const CaseStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  NEEDS_INFO: 'NEEDS_INFO',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const;
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];
export const CASE_STATUSES = values(CaseStatus);

export const CaseRoute = {
  CROWDFUNDING: 'CROWDFUNDING',
  AGA_KHAN_REFERRAL: 'AGA_KHAN_REFERRAL',
  MONTHLY_BUDGET: 'MONTHLY_BUDGET',
} as const;
export type CaseRoute = (typeof CaseRoute)[keyof typeof CaseRoute];
export const CASE_ROUTES = values(CaseRoute);

export const Priority = {
  VERY_URGENT: 'VERY_URGENT',
  URGENT: 'URGENT',
  NORMAL: 'NORMAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];
export const PRIORITIES = values(Priority);

export const DocumentKind = {
  MEDICAL_REPORT: 'MEDICAL_REPORT',
  ID_DOCUMENT: 'ID_DOCUMENT',
  HOSPITAL_QUOTE: 'HOSPITAL_QUOTE',
  HOSPITAL_INVOICE: 'HOSPITAL_INVOICE',
  OTHER: 'OTHER',
} as const;
export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind];
export const DOCUMENT_KINDS = values(DocumentKind);

export const CollectionPointType = {
  MOSQUE: 'MOSQUE',
  CENTER: 'CENTER',
  OFFICE: 'OFFICE',
  SHOP: 'SHOP',
  OTHER: 'OTHER',
} as const;
export type CollectionPointType =
  (typeof CollectionPointType)[keyof typeof CollectionPointType];
export const COLLECTION_POINT_TYPES = values(CollectionPointType);

export const PledgeChannel = {
  PLATFORM: 'PLATFORM',
  COUNCIL: 'COUNCIL',
  COLLECTOR: 'COLLECTOR',
} as const;
export type PledgeChannel = (typeof PledgeChannel)[keyof typeof PledgeChannel];
export const PLEDGE_CHANNELS = values(PledgeChannel);

export const PaymentMethod = {
  BEMO_TRANSFER: 'BEMO_TRANSFER',
  BANK_TRANSFER: 'BANK_TRANSFER',
  E_WALLET: 'E_WALLET',
  CASH: 'CASH',
  SHAM_CASH: 'SHAM_CASH',
  PAYPAL: 'PAYPAL',
  VISA: 'VISA',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PAYMENT_METHODS = values(PaymentMethod);

/** طرق متاحة فعلياً في Pledge & Verify (غير المحاكاة). */
export const REAL_PAYMENT_METHODS = [
  PaymentMethod.BEMO_TRANSFER,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.E_WALLET,
] as const;

/** طرق تظهر فقط في وضع العرض (DEMO_MODE). */
export const DEMO_PAYMENT_METHODS = [
  PaymentMethod.BEMO_TRANSFER,
  PaymentMethod.SHAM_CASH,
  PaymentMethod.PAYPAL,
  PaymentMethod.VISA,
] as const;

export const PledgeStatus = {
  PLEDGED: 'PLEDGED',
  RECEIPT_UPLOADED: 'RECEIPT_UPLOADED',
  COLLECTED: 'COLLECTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type PledgeStatus = (typeof PledgeStatus)[keyof typeof PledgeStatus];
export const PLEDGE_STATUSES = values(PledgeStatus);

export const VerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export const VERIFICATION_STATUSES = values(VerificationStatus);

export const ImportKind = { BENEFICIARIES: 'BENEFICIARIES' } as const;
export type ImportKind = (typeof ImportKind)[keyof typeof ImportKind];
export const IMPORT_KINDS = values(ImportKind);

export const ImportStatus = {
  PREVIEW: 'PREVIEW',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];
export const IMPORT_STATUSES = values(ImportStatus);
