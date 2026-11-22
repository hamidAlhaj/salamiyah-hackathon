/** أشكال الردود العامة من الـAPI (تستهلكها الويب والموبايل). المبالغ نصوص عشرية. */
import type { OutboxTemplate } from './constants';
import type {
  CampaignStatus,
  BeneficiaryKind,
  CaseCategory,
  CollectionPointType,
  Currency,
  OutboundStatus,
  PayeeType,
  PaymentMethod,
  PaymentMethodKind,
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

/** GET /categories: an active category with its description (behaviour flags stay internal). */
export interface PublicCategory extends PublicCampaignCategory {
  description: string | null;
  sortOrder: number;
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
  beneficiariesCount: number;
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
  /** Cash pledges: the collection point the donor chose (shown to the collector with the reference). */
  collectionPoint: Pick<PublicCollectionPoint, 'name' | 'area' | 'type'> | null;
  createdAt: string;
  verifiedAt: string | null;
}

/** GET /collection-points/active: where a donor can hand over cash (active points only). */
export interface PublicCollectionPoint {
  id: string;
  name: string;
  type: CollectionPointType;
  area: string;
}

export interface CreatePledgeResult {
  pledge: PledgeView;
  instructions: PaymentInstructions[];
}

/**
 * GET /official-receipts/:no: a verified donation's public receipt. Never the donor's phone or any
 * beneficiary identity; `donorName` is '' for «فاعل خير». `url` is the public page the QR encodes.
 */
export interface OfficialReceipt {
  receiptNo: string;
  donorName: string;
  amount: string;
  currency: Currency;
  method: PaymentMethod;
  methodLabel: string;
  channel: PledgeChannel;
  campaignTitle: string;
  campaignSlug: string;
  category: PublicCampaignCategory;
  /** Cash handed over at a collection point: where (name and type only). */
  collectionPoint: { name: string; type: CollectionPointType } | null;
  status: 'VERIFIED';
  verifiedAt: string;
  url: string;
  /** The QR code of `url` as an inline SVG (generated on the server). */
  qrSvg: string;
}

/**
 * The campaign account ledger. verified = real verified money; demo is shown separately and never part
 * of verified, spent or remaining; remaining = verified − spent.
 */
export interface CampaignLedger {
  campaignId: string;
  currency: Currency;
  targetAmount: string;
  verifiedAmount: string;
  pendingAmount: string;
  demoAmount: string;
  spentAmount: string;
  remainingAmount: string;
  donorsCount: number;
  beneficiariesCount: number;
}

/** A receiving account shown to donors (all account data is fake for the hackathon). */
export interface PaymentAccount {
  method: PaymentMethod;
  kind: PaymentMethodKind;
  label: string;
  accountName: string | null;
  accountNumber: string | null;
  instructions: string | null;
  note: string | null;
  /** 'campaign' when this campaign overrides the default account for the method. */
  source: 'default' | 'campaign';
  allowsReceiptUpload: boolean;
  /** Simulated instant payment («Demo» badge, never counted as verified). */
  allowsDemoCheckout: boolean;
}

/** An anonymised beneficiary as the public sees it: never a name, phone or national ID. */
export interface PublicBeneficiary {
  code: string;
  kind: BeneficiaryKind;
  area: string | null;
  monthlyAmount: string | null;
  since: string;
}

/** An in-app notification. `link` is a web path; the mobile app maps it to its own screen. */
export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

/** A WhatsApp outbox row for ADMIN: `openUrl` is the prefilled wa.me link (one tap to send). */
export interface OutboxItem {
  id: string;
  template: OutboxTemplate;
  status: OutboundStatus;
  phone: string;
  recipientName: string | null;
  body: string;
  link: string | null;
  openUrl: string | null;
  createdAt: string;
  openedAt: string | null;
}

/** A collection point assigned to the signed-in COLLECTOR, with how many cash pledges wait there. */
export interface CollectorPoint extends PublicCollectionPoint {
  pendingCount: number;
}

/**
 * A cash pledge as the collector sees it at their own points. `donorName` is null for «فاعل خير»
 * (anonymous donors and box totals); the donor's phone is never shown.
 */
export interface CollectorPledge {
  id: string;
  referenceNo: string;
  amount: string;
  currency: Currency;
  campaignTitle: string;
  donorName: string | null;
  status: PledgeStatus;
  channel: PledgeChannel;
  collectionPoint: PublicCollectionPoint | null;
  createdAt: string;
  /** When the collector confirmed receipt or recorded the amount (handed over to the council). */
  handedOverAt: string | null;
}

/**
 * One row of a campaign's public spending timeline. A beneficiary payment shows the beneficiary's
 * code only (`payeeLabel` is null); `proof` is set only when the proof was published at upload.
 */
export interface PublicExpenditure {
  id: string;
  paidAt: string;
  payeeType: PayeeType;
  payeeLabel: string | null;
  beneficiaryCode: string | null;
  amount: string;
  currency: Currency;
  description: string;
  periodMonth: string | null;
  proof: { mimeType: string } | null;
}
