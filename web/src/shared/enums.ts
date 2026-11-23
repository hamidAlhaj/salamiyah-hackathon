/**
 * Shared enums. Must match the Prisma enums in api/prisma/schema.prisma exactly,
 * and the copies in web/src/shared and mobile/src/shared.
 * Campaign categories are data (CampaignCategory table), not an enum: they are not listed here.
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
  EXPENDITURE_PROOF: 'EXPENDITURE_PROOF',
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
  SHAM_CASH: 'SHAM_CASH',
  SYRIATEL_CASH: 'SYRIATEL_CASH',
  MTN_CASH: 'MTN_CASH',
  PAYPAL: 'PAYPAL',
  VISA: 'VISA',
  CASH: 'CASH',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PAYMENT_METHODS = values(PaymentMethod);

export const PaymentMethodKind = {
  TRANSFER: 'TRANSFER',
  WALLET: 'WALLET',
  CARD: 'CARD',
  CASH: 'CASH',
} as const;
export type PaymentMethodKind = (typeof PaymentMethodKind)[keyof typeof PaymentMethodKind];
export const PAYMENT_METHOD_KINDS = values(PaymentMethodKind);

/** Methods that can use Pledge & Verify (transfer, then upload the receipt). PaymentMethodConfig decides per method. */
export const RECEIPT_PAYMENT_METHODS = [
  PaymentMethod.BEMO_TRANSFER,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.SHAM_CASH,
  PaymentMethod.SYRIATEL_CASH,
  PaymentMethod.MTN_CASH,
] as const;

/** Methods that can run as a simulated instant payment («Demo» badge, never counted as verified). */
export const DEMO_PAYMENT_METHODS = [
  PaymentMethod.BEMO_TRANSFER,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.SHAM_CASH,
  PaymentMethod.SYRIATEL_CASH,
  PaymentMethod.MTN_CASH,
  PaymentMethod.PAYPAL,
  PaymentMethod.VISA,
] as const;

export const PledgeStatus = {
  PLEDGED: 'PLEDGED',
  RECEIPT_UPLOADED: 'RECEIPT_UPLOADED',
  COLLECTED: 'COLLECTED',
  VERIFIED: 'VERIFIED',
  DEMO_CONFIRMED: 'DEMO_CONFIRMED',
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

export const BeneficiaryKind = {
  PATIENT: 'PATIENT',
  ORPHAN: 'ORPHAN',
  FAMILY: 'FAMILY',
  OTHER: 'OTHER',
} as const;
export type BeneficiaryKind = (typeof BeneficiaryKind)[keyof typeof BeneficiaryKind];
export const BENEFICIARY_KINDS = values(BeneficiaryKind);

export const PayeeType = {
  HOSPITAL: 'HOSPITAL',
  CONTRACTOR: 'CONTRACTOR',
  SUPPLIER: 'SUPPLIER',
  BENEFICIARY_FAMILY: 'BENEFICIARY_FAMILY',
  OTHER: 'OTHER',
} as const;
export type PayeeType = (typeof PayeeType)[keyof typeof PayeeType];
export const PAYEE_TYPES = values(PayeeType);

/** Admin-only history entries of a beneficiary record (violations log); never public. */
export const BeneficiaryNoteKind = {
  NOTE: 'NOTE',
  VIOLATION: 'VIOLATION',
  SUSPENDED: 'SUSPENDED',
  REACTIVATED: 'REACTIVATED',
} as const;
export type BeneficiaryNoteKind =
  (typeof BeneficiaryNoteKind)[keyof typeof BeneficiaryNoteKind];
export const BENEFICIARY_NOTE_KINDS = values(BeneficiaryNoteKind);

export const MessageChannel = { WHATSAPP: 'WHATSAPP' } as const;
export type MessageChannel = (typeof MessageChannel)[keyof typeof MessageChannel];
export const MESSAGE_CHANNELS = values(MessageChannel);

export const OutboundStatus = {
  QUEUED: 'QUEUED',
  OPENED: 'OPENED',
} as const;
export type OutboundStatus = (typeof OutboundStatus)[keyof typeof OutboundStatus];
export const OUTBOUND_STATUSES = values(OutboundStatus);
