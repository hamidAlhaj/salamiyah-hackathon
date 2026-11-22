import type {
  BeneficiaryKind,
  CampaignStatus,
  CaseCategory,
  CaseRoute,
  CaseStatus,
  Currency,
  PaymentMethod,
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

export interface VerificationItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  receipt: { id: string; mimeType: string; transferRef: string | null } | null;
  pledge: {
    id: string;
    referenceNo: string;
    amount: string;
    currency: Currency;
    channel: PledgeChannel;
    method: PaymentMethod;
    donorName: string | null;
    donorPhone: string | null;
    campaign: { slug: string; titleAr: string };
    collectionPoint: { name: string; type: string; contactName: string | null } | null;
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
