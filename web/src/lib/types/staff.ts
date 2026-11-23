import type {
  BeneficiaryKind,
  CampaignStatus,
  CaseCategory,
  CaseRoute,
  CaseStatus,
  CollectionPointType,
  Currency,
  PayeeType,
  PaymentMethod,
  PaymentMethodKind,
  PledgeChannel,
  Priority,
  Role,
} from '@/shared';

/** Shapes of staff-only API responses (they may contain private data: never render them publicly). */

export interface AdminCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  requiresMedicalCase: boolean;
  lockedPayeeHospital: boolean;
  supportsMonthlySponsorship: boolean;
  _count: { campaigns: number };
}

export interface StaffCampaignRow {
  id: string;
  slug: string;
  titleAr: string;
  status: CampaignStatus;
  acceptsPledges: boolean;
  priority: Priority;
  currency: Currency;
  targetAmount: string;
  verifiedAmount: string;
  spentAmount: string;
  category: { id: string; code: string; nameAr: string; icon: string };
  hospital: { id: string; nameAr: string } | null;
  _count: { beneficiaries: number };
}

export interface StaffBeneficiary {
  id: string;
  publicCode: string;
  kind: BeneficiaryKind;
  area: string | null;
  fullName: string;
  phone: string | null;
  isSuspended: boolean;
  createdAt: string;
  _count: { campaignLinks: number };
  /** Active campaign links only. */
  campaignLinks: {
    monthlyAmount: string | null;
    startedAt: string;
    campaign: { id: string; slug: string; titleAr: string; titleEn: string | null };
  }[];
}

/** ADMIN account list (never a password hash). */
export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  collectionPoints: { id: string; name: string }[];
}

export interface AdminHospital {
  id: string;
  nameAr: string;
  nameEn: string | null;
  city: string;
  isPrivate: boolean;
  isActive: boolean;
  _count: { cases: number; campaigns: number; expenditures: number };
}

export interface AdminCollectionPoint {
  id: string;
  name: string;
  type: CollectionPointType;
  contactName: string | null;
  area: string;
  isActive: boolean;
  collectors: { id: string; fullName: string; isActive: boolean }[];
  _count: { pledges: number };
}

/** A method's default receiving details (fake accounts for the hackathon). */
export interface PaymentMethodConfigRow {
  id: string;
  method: PaymentMethod;
  kind: PaymentMethodKind;
  labelAr: string;
  labelEn: string;
  accountName: string | null;
  accountNameEn: string | null;
  accountNumber: string | null;
  instructionsAr: string | null;
  instructionsEn: string | null;
  allowsReceiptUpload: boolean;
  allowsDemoCheckout: boolean;
  isActive: boolean;
  sortOrder: number;
}

/** A campaign's own receiving account for one method. */
export interface CampaignAccountOverride {
  method: PaymentMethod;
  accountName: string;
  accountNumber: string;
  note: string | null;
}

export interface Hospital {
  id: string;
  nameAr: string;
  nameEn: string | null;
  city: string;
}

export interface CaseRow {
  id: string;
  trackingNo: string;
  status: CaseStatus;
  priority: Priority | null;
  route: CaseRoute | null;
  category: CaseCategory;
  beneficiaryName: string;
  localCouncil: string | null;
  requestedAmount: string;
  approvedAmount: string | null;
  currency: Currency;
  hospital: { id: string; nameAr: string } | null;
  campaign: { id: string; slug: string; acceptsPledges: boolean } | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface CaseDetail {
  id: string;
  trackingNo: string;
  status: CaseStatus;
  priority: Priority | null;
  route: CaseRoute | null;
  category: CaseCategory;
  description: string;
  requestedAmount: string;
  approvedAmount: string | null;
  currency: Currency;
  doctorName: string | null;
  rejectionReason: string | null;
  hospital: { id: string; nameAr: string } | null;
  beneficiary: {
    fullName: string;
    phone: string | null;
    publicCode: string;
    nationalIdLast4: string | null;
    localCouncil: string | null;
    otherPrograms: string[];
  };
  documents: { id: string; kind: string; originalName: string; mimeType: string }[];
  campaign: { id: string; slug: string; status: CampaignStatus; acceptsPledges: boolean } | null;
  beneficiaryHistory: { id: string; trackingNo: string; status: CaseStatus; createdAt: string }[];
}

export interface CreateCaseResult {
  id: string;
  trackingNo: string;
  warnings: {
    openCasesForSameNationalId: { id: string; trackingNo: string; status: CaseStatus }[];
    otherBeneficiariesWithSamePhone: { id: string; fullName: string; otherPrograms: string[] }[];
    otherPrograms: string[];
  };
}

export type VerificationStatusTab = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationItem {
  id: string;
  status: VerificationStatusTab;
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
  reviewer: string | null;
  /** The caller recorded or donated this entry: they may not decide it (separation of duties). */
  ownEntry: boolean;
  receipt: { id: string; mimeType: string; transferRef: string | null } | null;
  pledge: {
    id: string;
    referenceNo: string;
    amount: string;
    currency: Currency;
    channel: PledgeChannel;
    method: PaymentMethod;
    isAnonymousDisplay: boolean;
    officialReceiptNo: string | null;
    donorName: string | null;
    donorPhone: string | null;
    campaign: { slug: string; titleAr: string };
    collectionPoint: {
      name: string;
      type: CollectionPointType;
      area: string;
      contactName: string | null;
    } | null;
    recordedBy: { fullName: string; role: Role } | null;
  };
}

export interface ImportPreview {
  jobId: string;
  fileName: string;
  totalRows: number;
  headers: string[];
  sampleRows: string[][];
  fields: string[];
  suggestedMapping: Record<string, string>;
}

export interface ImportValidation {
  jobId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  errors: { row: number; field: string; message: string }[];
}

/** GET /campaigns/:id/spending-context: what the spending page needs (rules come from the flags). */
export interface SpendingContext {
  campaign: {
    id: string;
    slug: string;
    title: string;
    status: CampaignStatus;
    isOngoing: boolean;
    currency: Currency;
    targetAmount: string;
    verifiedAmount: string;
    spentAmount: string;
    remainingAmount: string;
    category: {
      code: string;
      name: string;
      icon: string;
      lockedPayeeHospital: boolean;
      supportsMonthlySponsorship: boolean;
    };
  };
  hospital: { id: string; name: string } | null;
  beneficiaries: {
    id: string;
    code: string;
    kind: BeneficiaryKind;
    monthlyAmount: string | null;
  }[];
  paidMonths: { periodMonth: string; count: number }[];
}

/** GET /campaigns/:id/expenditures (staff): every expenditure with its proof (public or not). */
export interface StaffExpenditure {
  id: string;
  payeeType: PayeeType;
  payee: string;
  hospital: string | null;
  beneficiaryCode: string | null;
  amount: string;
  currency: Currency;
  paidAt: string;
  periodMonth: string | null;
  description: string;
  descriptionEn: string | null;
  recordedBy: string;
  proofDocumentId: string | null;
  proofMimeType: string | null;
  proofPublic: boolean;
}
