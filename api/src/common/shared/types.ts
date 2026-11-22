/** أشكال الردود العامة من الـAPI (تستهلكها الويب والموبايل). المبالغ نصوص عشرية. */
import type {
  CampaignStatus,
  CaseCategory,
  Currency,
  PaymentMethod,
  PledgeChannel,
  PledgeStatus,
  Priority,
  Role,
} from './enums';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
  locale: 'ar' | 'en';
}

/** Body of POST /auth/login and POST /auth/register. One 8h access token, no refresh token. */
export interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}

/** A campaign category as the public sees it (categories are data, see CampaignCategory). */
export interface PublicCampaignCategory {
  id: string;
  code: string;
  name: string;
  icon: string;
}

export interface PublicCampaign {
  id: string;
  slug: string;
  category: PublicCampaignCategory;
  isOngoing: boolean;
  title: string;
  summary: string;
  coverKey: string | null;
  area: string | null;
  /** Medical cases only: the case category (surgery, medication, …). */
  caseCategory: CaseCategory | null;
  priority: Priority;
  status: CampaignStatus;
  currency: Currency;
  targetAmount: string;
  /** Real, verified money only. */
  verifiedAmount: string;
  /** تعهدات بإيصال أو حصيلة نقاط جمع بانتظار التحقق. */
  pendingAmount: string;
  /** Simulated payments («Demo»): shown separately, never part of verifiedAmount. */
  demoAmount: string;
  spentAmount: string;
  hospitalName: string | null;
  acceptsPledges: boolean;
  isAnonymousCase: boolean;
  publishedAt: string | null;
  donorsCount: number;
}

export interface CampaignUpdateView {
  id: string;
  body: string;
  createdAt: string;
}

export interface PublicCampaignDetail extends PublicCampaign {
  fileNo: string | null;
  updates: CampaignUpdateView[];
}

export interface PaymentInstructions {
  method: PaymentMethod;
  accountName: string;
  accountNumber: string;
  bankName: string;
  note: string;
}

export interface PledgeView {
  id: string;
  referenceNo: string;
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  amount: string;
  currency: Currency;
  channel: PledgeChannel;
  method: PaymentMethod;
  status: PledgeStatus;
  isDemo: boolean;
  isAnonymousDisplay: boolean;
  officialReceiptNo: string | null;
  rejectionReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface CreatePledgeResult {
  pledge: PledgeView;
  instructions: PaymentInstructions[];
}

export interface OfficialReceipt {
  receiptNo: string;
  donorName: string;
  amount: string;
  currency: Currency;
  campaignTitle: string;
  campaignSlug: string;
  verifiedAt: string;
}
