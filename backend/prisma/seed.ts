/**
 * Final demo seed (P16). Fictional data only — nothing here is real.
 *
 * Deterministic: fixed people, codes, references and amounts; dates are whole months before "now",
 * so the transparency charts always show the last six months. What it creates:
 * - one user per role (+ a second collector and a few fictional donors), opted-in alert donors
 *   (DEMO_WHATSAPP_NUMBERS from backend/.env when set, never printed; fictional numbers otherwise);
 * - collection points CENTER / MOSQUE / OFFICE, three hospitals, the three system categories;
 * - fake receiving accounts for every method, plus one per-campaign override;
 * - 7 public campaigns (2 orphan sponsorship, 2 home renovation, 3 medical aid from the case
 *   pipeline) in the states ACTIVE / FUNDED / COMPLETED («تم الإنجاز», with public proofs);
 * - a registered incubator case ready for review (demo step 2) and an overdue case;
 * - 12 unlinked orphans B-0412…B-0423 for the live «كفالة 12 يتيماً لعام 2027» (demo step 1);
 * - verified donations over 6 months on every channel, expenditures with public proofs, orphan
 *   sponsorship paid up to last month (this month is paid live in step 7);
 * - pledges in every status and pending items in the finance and collector queues.
 *
 * Run: npm run seed (refuses to run unless DATABASE_URL is the local majlis_fund database).
 * Full reset: npm run demo:reset. The expected demo numbers are listed in DEMO.md.
 */
import {
  PrismaClient,
  Prisma,
  type Campaign,
  type CaseCategory,
  type CollectionPoint,
  type PayeeType,
  type PaymentMethod,
  type Priority,
  type Role,
  type User,
} from '@prisma/client';
import { hash } from 'bcrypt';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  checkSeedDatabaseUrl,
  SEED_SAFETY_OVERRIDE_ENV_VAR,
} from '../src/common/seed-safety.util';
import { officialReceiptNo } from '../src/common/utils/codes';
import { normalizePhone } from '../src/common/shared';

/** كلمة مرور تجريبية موحّدة لكل حسابات الـseed (تطوير فقط). */
export const SEED_PASSWORD = 'Majlis@2026';

const prisma = new PrismaClient();
const uploadsRoot = resolve(process.env.STORAGE_LOCAL_DIR ?? 'uploads');
const hmacKey = process.env.NATIONAL_ID_HMAC_KEY ?? 'dev-national-id-key-change-me';
const NOW = new Date();

// ───────────── helpers ─────────────

/** Day `day` of the month `monthsAgo` whole months before now (UTC), never later than now. */
function at(monthsAgo: number, day: number, hour = 10): Date {
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - monthsAgo, day, hour));
  return d > NOW ? new Date(NOW.getTime() - 60 * 60_000) : d;
}

/** YYYY-MM of the month `monthsAgo` whole months before now (UTC). */
function period(monthsAgo: number): string {
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - monthsAgo, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function placeholderImage(folder: string, lines: string[]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="100%" height="100%" fill="#f4f6f8"/>
    <rect x="30" y="30" width="540" height="740" fill="#ffffff" stroke="#c9ced6" stroke-width="2"/>
    ${lines.map((l, i) => `<text x="60" y="${110 + i * 48}" font-family="Arial" font-size="${i === 0 ? 30 : 22}" fill="#1d2433">${l}</text>`).join('')}
    <text x="60" y="740" font-family="Arial" font-size="16" fill="#8a93a3">SAMPLE — DEMO DATA ONLY</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  const storageKey = `${folder}/${randomUUID()}.jpg`;
  await mkdir(join(uploadsRoot, folder), { recursive: true });
  await writeFile(join(uploadsRoot, storageKey), data);
  return {
    storageKey,
    mimeType: 'image/jpeg',
    sizeBytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

function nationalId(id: string) {
  return {
    nationalIdHash: createHmac('sha256', hmacKey).update(id).digest('hex'),
    nationalIdLast4: id.slice(-4),
  };
}

async function nextReceiptNo(verifiedAt: Date): Promise<string> {
  const [row] = await prisma.$queryRaw<
    { nextval: bigint }[]
  >`SELECT nextval('official_receipt_seq')`;
  return officialReceiptNo(Number(row?.nextval ?? 0), verifiedAt);
}

// Refuse the destructive reset unless DATABASE_URL clearly points at the dedicated local database.
function assertSafeToResetDemoData(): void {
  if (process.env[SEED_SAFETY_OVERRIDE_ENV_VAR] === 'true') {
    console.warn(
      `${SEED_SAFETY_OVERRIDE_ENV_VAR}=true is set - skipping the local-database safety check.`,
    );
    return;
  }
  const result = checkSeedDatabaseUrl(process.env.DATABASE_URL);
  if (!result.safe) {
    throw new Error(
      [
        'Refusing to run the destructive demo seed: DATABASE_URL is not the local majlis_fund database.',
        `  ${result.reason}`,
        `Set ${SEED_SAFETY_OVERRIDE_ENV_VAR}=true only for a deliberately configured alternate local setup.`,
      ].join('\n'),
    );
  }
}

async function reset() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production');
  assertSafeToResetDemoData();
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.outboundMessage.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.receipt.deleteMany(),
    prisma.pledge.deleteMany(),
    prisma.expenditure.deleteMany(),
    prisma.campaignUpdate.deleteMany(),
    prisma.campaignBeneficiary.deleteMany(),
    prisma.campaignPaymentAccount.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.campaignCategory.deleteMany(),
    prisma.paymentMethodConfig.deleteMany(),
    prisma.document.deleteMany(),
    prisma.case.deleteMany(),
    prisma.beneficiary.deleteMany(),
    prisma.importJob.deleteMany(),
    prisma.collectionPoint.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  await prisma.$executeRaw`ALTER SEQUENCE official_receipt_seq RESTART WITH 1`;
}

// ───────────── fixed reference data ─────────────

const PAYMENT_METHODS: Prisma.PaymentMethodConfigCreateManyInput[] = [
  {
    method: 'BEMO_TRANSFER',
    kind: 'TRANSFER',
    labelAr: 'حوالة بنك بيمو',
    labelEn: 'Bemo bank transfer',
    accountName: 'المجلس المحلي في السلمية (تجريبي)',
    accountNameEn: 'Salamiyah Local Council (demo)',
    accountNumber: '0000-1111-2222 (FAKE)',
    instructionsAr: 'اكتب رقم مرجع التبرع في ملاحظة الحوالة، ثم ارفع صورة الإيصال.',
    instructionsEn:
      'Write the donation reference in the transfer note, then upload the receipt.',
    allowsReceiptUpload: true,
    allowsDemoCheckout: true,
    sortOrder: 10,
  },
  {
    method: 'BANK_TRANSFER',
    kind: 'TRANSFER',
    labelAr: 'حوالة مصرفية',
    labelEn: 'Bank transfer',
    accountName: 'المجلس المحلي في السلمية (تجريبي)',
    accountNameEn: 'Salamiyah Local Council (demo)',
    accountNumber: 'SY00 0000 0000 0000 (FAKE)',
    allowsReceiptUpload: true,
    allowsDemoCheckout: true,
    sortOrder: 20,
  },
  {
    method: 'SHAM_CASH',
    kind: 'WALLET',
    labelAr: 'شام كاش',
    labelEn: 'ShamCash',
    accountName: 'المجلس المحلي في السلمية (تجريبي)',
    accountNameEn: 'Salamiyah Local Council (demo)',
    accountNumber: '0930 000 001 (FAKE)',
    allowsReceiptUpload: true,
    allowsDemoCheckout: true,
    sortOrder: 30,
  },
  {
    method: 'SYRIATEL_CASH',
    kind: 'WALLET',
    labelAr: 'سيريتل كاش',
    labelEn: 'Syriatel Cash',
    accountName: 'المجلس المحلي في السلمية (تجريبي)',
    accountNameEn: 'Salamiyah Local Council (demo)',
    accountNumber: '0930 000 002 (FAKE)',
    allowsReceiptUpload: true,
    allowsDemoCheckout: true,
    sortOrder: 40,
  },
  {
    method: 'MTN_CASH',
    kind: 'WALLET',
    labelAr: 'MTN كاش',
    labelEn: 'MTN Cash',
    accountName: 'المجلس المحلي في السلمية (تجريبي)',
    accountNameEn: 'Salamiyah Local Council (demo)',
    accountNumber: '0940 000 003 (FAKE)',
    allowsReceiptUpload: true,
    allowsDemoCheckout: true,
    sortOrder: 50,
  },
  {
    method: 'PAYPAL',
    kind: 'CARD',
    labelAr: 'PayPal',
    labelEn: 'PayPal',
    allowsDemoCheckout: true,
    sortOrder: 60,
  },
  {
    method: 'VISA',
    kind: 'CARD',
    labelAr: 'بطاقة Visa',
    labelEn: 'Visa card',
    allowsDemoCheckout: true,
    sortOrder: 70,
  },
  {
    method: 'CASH',
    kind: 'CASH',
    labelAr: 'نقداً في نقطة جمع',
    labelEn: 'Cash at a collection point',
    sortOrder: 80,
  },
];

/** Fixed id of the seeded Google donor without a phone (e2e: tests/06-google-signin.spec.ts). */
const GOOGLE_DEMO_DONOR_ID = '22222222-0000-4000-8000-000000000022';

async function main() {
  await reset();
  const passwordHash = await hash(SEED_PASSWORD, 10);

  // ── Users: one per role (fixed demo logins), a second collector, fictional donors ──
  // Donor codes D-000001, D-000002, … in creation order: generated codes never contain 0 or 1, so
  // these cannot collide with codes the app creates later.
  let userNo = 0;
  const mkUser = (
    fullName: string,
    phone: string,
    role: Role,
    extra: Partial<Prisma.UserCreateInput> = {},
  ) => {
    userNo += 1;
    const donorCode = `D-${String(userNo).padStart(6, '0')}`;
    return prisma.user.create({
      data: { fullName, phone, role, locale: 'ar', passwordHash, donorCode, ...extra },
    });
  };
  const admin = await mkUser('مدير النظام', '+963900000001', 'ADMIN');
  const caseOfficer = await mkUser(
    'مدقق الحالات (هيئة الإنعاش)',
    '+963900000002',
    'CASE_OFFICER',
  );
  const finance = await mkUser('المدقق المالي', '+963900000003', 'FINANCE_VERIFIER');
  const staff = await mkUser('موظف المجلس المحلي', '+963900000004', 'STAFF');
  const collector = await mkUser('مكي نقاط الجمع', '+963900000005', 'COLLECTOR');
  const donor = await mkUser('متبرع تجريبي', '+963900000006', 'DONOR', {
    whatsappOptIn: true,
  });
  const diaspora = await mkUser('Diaspora Donor', '+4915100000007', 'DONOR', {
    locale: 'en',
  });
  const officeCollector = await mkUser('مكي نقطة المكتب', '+963900000008', 'COLLECTOR');
  // Fictional donors with accounts (Pledge & Verify and cash at a point need a donor account).
  const nour = await mkUser('نور ش. (مثال)', '+963900000011', 'DONOR');
  const rami = await mkUser('رامي ك. (مثال)', '+963900000012', 'DONOR');
  const waseem = await mkUser('وسيم ع. (مثال)', '+963900000013', 'DONOR');
  const suad = await mkUser('سعاد ن. (مثال)', '+963900000014', 'DONOR');
  const karim = await mkUser('كريم ه. (مثال)', '+963900000015', 'DONOR');

  // Opted-in alert donors («الخيرين»): the team's real numbers from DEMO_WHATSAPP_NUMBERS in
  // backend/.env only — never committed or printed — or fictional numbers when it is empty.
  const realNumbers = (process.env.DEMO_WHATSAPP_NUMBERS ?? '')
    .split(',')
    .map((n) => normalizePhone(n.trim()))
    .filter((n): n is string => n !== null);
  const alertPhones =
    realNumbers.length > 0 ? realNumbers : ['+963999900001', '+963999900002'];
  for (const [i, phone] of alertPhones.entries()) {
    await mkUser(`فاعل خير ${i + 1} (مثال)`, phone, 'DONOR', { whatsappOptIn: true });
  }
  // A donor who signed in with Google and has not added a phone yet (P22): no phone, no password,
  // a fictional Google id. Nobody can log in as this account (it exists for the e2e check that
  // donating is refused with `phone_required`); the fixed id lets the e2e test address it.
  await prisma.user.create({
    data: {
      id: GOOGLE_DEMO_DONOR_ID,
      fullName: 'متبرعة عبر Google (مثال)',
      phone: null,
      email: 'google.donor@example.com',
      googleSub: 'demo-google-sub-000000000001',
      passwordHash: null,
      role: 'DONOR',
      locale: 'ar',
      donorCode: 'D-000099',
    },
  });

  // ── Hospitals (fictional) ──
  const national = await prisma.hospital.create({
    data: {
      nameAr: 'المشفى الوطني بالسلمية',
      nameEn: 'Salamiyah National Hospital',
      city: 'السلمية',
    },
  });
  const hourani = await prisma.hospital.create({
    data: {
      nameAr: 'مشفى الحوراني',
      nameEn: 'Al-Hourani Hospital',
      city: 'السلمية',
      isPrivate: true,
    },
  });
  await prisma.hospital.create({
    data: {
      nameAr: 'المركز الصحي – الآغا خان',
      nameEn: 'Aga Khan Health Centre',
      city: 'السلمية',
    },
  });

  // ── Collection points CENTER / MOSQUE / OFFICE (fictional contacts, who are not users) ──
  const pointNorth = await prisma.collectionPoint.create({
    data: {
      name: 'نقطة جمع الحي الشمالي',
      type: 'CENTER',
      contactName: 'أبو فادي (مثال)',
      area: 'الحي الشمالي',
      collectors: { connect: { id: collector.id } },
    },
  });
  const pointWest = await prisma.collectionPoint.create({
    data: {
      name: 'نقطة جمع الحي الغربي',
      type: 'MOSQUE',
      contactName: 'أبو نزار (مثال)',
      area: 'الحي الغربي',
      collectors: { connect: { id: collector.id } },
    },
  });
  const pointOffice = await prisma.collectionPoint.create({
    data: {
      name: 'مكتب المجلس المحلي',
      type: 'OFFICE',
      contactName: 'موظف الاستقبال (مثال)',
      area: 'وسط المدينة',
      collectors: { connect: { id: officeCollector.id } },
    },
  });
  const collectorOf = (point: CollectionPoint) =>
    point.id === pointOffice.id ? officeCollector : collector;

  // ── System campaign categories (data, not an enum). Rules read the flags, never the code. ──
  const mkCategory = (data: Prisma.CampaignCategoryCreateInput) =>
    prisma.campaignCategory.create({ data: { isSystem: true, ...data } });
  const medicalAid = await mkCategory({
    code: 'MEDICAL_AID',
    nameAr: 'مساعدات طبية',
    nameEn: 'Medical aid',
    descriptionAr: 'حالات طبية مدققة من هيئة الإنعاش، والصرف للمشفى المعتمد فقط.',
    descriptionEn:
      'Medical cases vetted by the welfare board; payment only to the approved hospital.',
    icon: 'heart-pulse',
    sortOrder: 30,
    requiresMedicalCase: true,
    lockedPayeeHospital: true,
    beneficiaryKind: 'PATIENT',
  });
  const orphanSponsorship = await mkCategory({
    code: 'ORPHAN_SPONSORSHIP',
    nameAr: 'كفالة أيتام',
    nameEn: 'Orphan sponsorship',
    descriptionAr: 'كفالة شهرية لأيتام من السلمية، تُصرف لأسرهم كل شهر.',
    descriptionEn:
      'Monthly sponsorship for orphans in Salamiyah, paid to their families each month.',
    icon: 'child',
    sortOrder: 10,
    supportsMonthlySponsorship: true,
    beneficiaryKind: 'ORPHAN',
  });
  const homeRenovation = await mkCategory({
    code: 'HOME_RENOVATION',
    nameAr: 'ترميم منازل',
    nameEn: 'Home renovation',
    descriptionAr: 'ترميم منازل أسر محتاجة، والصرف للمقاول أو المورد مع الفاتورة.',
    descriptionEn:
      'Repairing the homes of families in need; paid to the contractor or supplier with an invoice.',
    icon: 'home',
    sortOrder: 20,
    beneficiaryKind: 'FAMILY',
  });

  // ── Receiving details per method. Every account name and number is FAKE (hackathon only). ──
  await prisma.paymentMethodConfig.createMany({ data: PAYMENT_METHODS });

  // ── Anonymised beneficiaries with fixed public codes. Generated codes never contain 0 or 1, so
  //    these B-0xxx codes cannot collide with codes created later in the app. Names are fictional
  //    and private (never shown publicly). ──
  const mkBeneficiary = (
    publicCode: string,
    kind: 'PATIENT' | 'ORPHAN' | 'FAMILY',
    area: string,
    extra: Partial<Prisma.BeneficiaryCreateInput> = {},
  ) =>
    prisma.beneficiary.create({
      data: {
        publicCode,
        kind,
        area,
        fullName: `مستفيد ${publicCode} (مثال)`,
        localCouncil: 'المجلس المحلي - السلمية',
        ...extra,
      },
    });
  const range = (prefix: string, from: number, count: number) =>
    Array.from({ length: count }, (_, i) => `B-${prefix}${String(from + i).padStart(2, '0')}`);

  const sheikhBadrOrphans = [];
  for (const code of range('03', 1, 4))
    sheikhBadrOrphans.push(await mkBeneficiary(code, 'ORPHAN', 'حي الشيخ بدر'));
  const jammasaOrphans = [];
  for (const code of range('03', 11, 6))
    jammasaOrphans.push(await mkBeneficiary(code, 'ORPHAN', 'حي الجماسة'));
  // Demo step 1: 12 orphans registered but not yet linked to any campaign.
  for (const code of range('04', 12, 12)) await mkBeneficiary(code, 'ORPHAN', 'السلمية');
  const baathFamily = await mkBeneficiary('B-0201', 'FAMILY', 'حي البعث');
  const rainFamilies = [
    await mkBeneficiary('B-0202', 'FAMILY', 'حي الوراقة'),
    await mkBeneficiary('B-0203', 'FAMILY', 'حي الوراقة'),
  ];

  // ── Medical cases (all anonymous on public pages). Three are published as MEDICAL_AID campaigns;
  //    the incubator case is registered and waits for the case officer (demo step 2); the last one
  //    is overdue (SLA). ──
  interface SeedCase {
    code: string;
    trackingNo: string;
    name: string;
    phone: string;
    nid: string;
    category: CaseCategory;
    description: string;
    amount: number;
    priority: Priority;
    anonymous: boolean;
    otherPrograms?: string[];
    slaDays: number;
    published?: {
      slug: string;
      coverKey: string;
      titleAr: string;
      titleEn: string;
      summaryAr: string;
      summaryEn: string;
      publishedMonthsAgo: number;
      status: 'ACTIVE' | 'FUNDED';
    };
  }
  const cases: SeedCase[] = [
    {
      code: 'B-0101',
      trackingNo: 'MF-2026-DEMO1',
      name: 'م. ع.',
      phone: '+963933100201',
      nid: '04010100201',
      category: 'SURGERY',
      description:
        'رب أسرة يحتاج عملية قلب مفتوح عاجلة. التقرير من المشفى الوطني، والتكلفة المعتمدة 15 مليون.',
      amount: 15_000_000,
      priority: 'VERY_URGENT',
      anonymous: true,
      slaDays: 7,
      published: {
        slug: 'heart-surgery-father',
        coverKey: 'medical-1',
        titleAr: 'عملية قلب مفتوح عاجلة لرب أسرة',
        titleEn: 'Urgent open-heart surgery for a father',
        summaryAr:
          'رب أسرة من السلمية يحتاج عملية قلب مفتوح خلال أسبوعين. الحالة مدققة من هيئة الإنعاش والطبيب المعتمد، والصرف مباشرة للمشفى الوطني.',
        summaryEn:
          'A father from Salamiyah needs open-heart surgery within two weeks. Vetted by the welfare board; funds go directly to the National Hospital.',
        publishedMonthsAgo: 3,
        status: 'ACTIVE',
      },
    },
    {
      code: 'B-0102',
      trackingNo: 'MF-2026-DEMO2',
      name: 'ر. ح.',
      phone: '+963933100202',
      nid: '04010100202',
      category: 'INCUBATOR',
      description:
        'مولود خديج يحتاج حاضنة لمدة 3 أسابيع في المشفى الوطني. التكلفة المقدرة 4.5 مليون والأسرة غير قادرة على تغطيتها.',
      amount: 4_500_000,
      priority: 'URGENT',
      anonymous: true,
      otherPrograms: ['الرعاية الاجتماعية'],
      slaDays: 5,
    },
    {
      code: 'B-0103',
      trackingNo: 'MF-2026-DEMO3',
      name: 'أبو سمير',
      phone: '+963933100203',
      nid: '04010100203',
      category: 'MEDICATION',
      description: 'أدوية مزمنة لمدة 6 أشهر.',
      amount: 2_400_000,
      priority: 'NORMAL',
      anonymous: true,
      slaDays: 7,
      published: {
        slug: 'chronic-medication-elder',
        coverKey: 'medical-2',
        titleAr: 'أدوية مزمنة لمريض مسن لستة أشهر',
        titleEn: 'Six months of chronic medication for an elderly patient',
        summaryAr:
          'مريض مسن من السلمية يحتاج أدوية مزمنة شهرية لستة أشهر، والصرف للمشفى المعتمد.',
        summaryEn:
          'An elderly patient in Salamiyah needs monthly chronic medication for six months; paid to the approved hospital.',
        publishedMonthsAgo: 5,
        status: 'FUNDED',
      },
    },
    {
      code: 'B-0104',
      trackingNo: 'MF-2026-DEMO4',
      name: 'أم خالد',
      phone: '+963933100204',
      nid: '04010100204',
      category: 'ONCOLOGY',
      description: 'جرعات علاج كيميائي وتحاليل لمدة 3 أشهر.',
      amount: 8_000_000,
      priority: 'URGENT',
      anonymous: true,
      slaDays: 7,
      published: {
        slug: 'chemotherapy-mother',
        coverKey: 'medical-1',
        titleAr: 'جرعات علاج كيميائي لأم من السلمية',
        titleEn: 'Chemotherapy doses for a mother in Salamiyah',
        summaryAr: 'أم من السلمية تحتاج جرعات علاج كيميائي وتحاليل لثلاثة أشهر.',
        summaryEn: 'A mother in Salamiyah needs three months of chemotherapy and tests.',
        publishedMonthsAgo: 2,
        status: 'ACTIVE',
      },
    },
    {
      code: 'B-0105',
      trackingNo: 'MF-2026-DEMO5',
      name: 'س. ن.',
      phone: '+963933100205',
      nid: '04010100205',
      category: 'SURGERY',
      description: 'كسر في الحوض يحتاج عملية تثبيت. بانتظار تقييم هيئة الإنعاش.',
      amount: 6_000_000,
      priority: 'URGENT',
      anonymous: false,
      slaDays: -2, // overdue
    },
  ];

  const medical = new Map<string, Campaign>();
  for (const [i, c] of cases.entries()) {
    const report = await placeholderImage('cases', [
      'MEDICAL REPORT',
      `Case #${i + 1}`,
      `Category: ${c.category}`,
    ]);
    const beneficiary = await mkBeneficiary(c.code, 'PATIENT', 'السلمية', {
      fullName: c.name,
      phone: c.phone,
      otherPrograms: c.otherPrograms ?? [],
      ...nationalId(c.nid),
    });
    const p = c.published;
    const submittedAt = p ? at(p.publishedMonthsAgo, 1) : at(0, 1);
    const created = await prisma.case.create({
      data: {
        trackingNo: c.trackingNo,
        beneficiaryId: beneficiary.id,
        category: c.category,
        description: c.description,
        requestedAmount: c.amount,
        submittedById: staff.id,
        createdAt: submittedAt,
        slaDueAt: new Date(NOW.getTime() + c.slaDays * 86_400_000),
        ...(p
          ? {
              status: 'PUBLISHED',
              priority: c.priority,
              route: 'CROWDFUNDING',
              hospitalId: national.id,
              doctorName: i % 2 === 0 ? 'د. سامر (مثال)' : 'د. ريم (مثال)',
              approvedAmount: c.amount,
              isAnonymous: c.anonymous,
              redactedSummary: p.summaryAr,
              reviewedById: caseOfficer.id,
              reviewedAt: at(p.publishedMonthsAgo, 1, 14),
            }
          : { status: 'SUBMITTED', isAnonymous: c.anonymous }),
        documents: {
          create: {
            kind: 'MEDICAL_REPORT',
            originalName: 'report.jpg',
            uploadedById: staff.id,
            ...report,
          },
        },
      },
    });
    if (!p) continue;
    const campaign = await prisma.campaign.create({
      data: {
        slug: p.slug,
        categoryId: medicalAid.id,
        caseId: created.id,
        coverKey: p.coverKey,
        area: 'السلمية',
        // The patient is linked anonymised, as case publish does.
        beneficiaries: {
          create: [{ beneficiaryId: beneficiary.id, startedAt: at(p.publishedMonthsAgo, 2) }],
        },
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        summaryAr: p.summaryAr,
        summaryEn: p.summaryEn,
        priority: c.priority,
        targetAmount: c.amount,
        hospitalId: national.id,
        status: p.status,
        publishedAt: at(p.publishedMonthsAgo, 2),
        createdAt: at(p.publishedMonthsAgo, 2),
        createdById: caseOfficer.id,
      },
    });
    medical.set(p.slug, campaign);
  }
  const heart = medical.get('heart-surgery-father');
  const medication = medical.get('chronic-medication-elder');
  const chemo = medical.get('chemotherapy-mother');
  if (!heart || !medication || !chemo) throw new Error('seed medical campaigns missing');

  // ── Orphan sponsorship and home renovation campaigns (created by the ADMIN) ──
  const sheikhBadr = await prisma.campaign.create({
    data: {
      slug: 'orphans-sheikh-badr',
      categoryId: orphanSponsorship.id,
      isOngoing: true,
      titleAr: 'كفالة أيتام حي الشيخ بدر',
      titleEn: 'Sponsoring orphans in Sheikh Badr',
      summaryAr:
        'كفالة شهرية مستمرة لأربعة أيتام في حي الشيخ بدر، تُصرف لأسرهم في نهاية كل شهر.',
      summaryEn:
        'Ongoing monthly sponsorship for four orphans in Sheikh Badr, paid to their families at the end of every month.',
      priority: 'NORMAL',
      targetAmount: 9_600_000,
      coverKey: 'orphans-1',
      area: 'حي الشيخ بدر',
      status: 'ACTIVE',
      publishedAt: at(5, 1),
      createdAt: at(5, 1),
      createdById: admin.id,
      beneficiaries: {
        create: sheikhBadrOrphans.map((b) => ({
          beneficiaryId: b.id,
          monthlyAmount: 200_000,
          startedAt: at(5, 1),
        })),
      },
    },
  });
  const jammasa = await prisma.campaign.create({
    data: {
      slug: 'orphans-aljammasa',
      categoryId: orphanSponsorship.id,
      titleAr: 'كفالة 6 أيتام في حي الجماسة لعام كامل',
      titleEn: 'A full year of sponsorship for 6 orphans in Al-Jammasa',
      summaryAr:
        'كفالة ستة أيتام في حي الجماسة لمدة اثني عشر شهراً بمبلغ شهري ثابت لكل يتيم. اكتمل التمويل والصرف مستمر شهرياً.',
      summaryEn:
        'Twelve months of sponsorship for six orphans in Al-Jammasa at a fixed monthly amount each. Fully funded; paid monthly.',
      priority: 'NORMAL',
      targetAmount: 10_800_000,
      coverKey: 'orphans-2',
      area: 'حي الجماسة',
      status: 'FUNDED',
      publishedAt: at(5, 1),
      createdAt: at(5, 1),
      createdById: admin.id,
      beneficiaries: {
        create: jammasaOrphans.map((b) => ({
          beneficiaryId: b.id,
          monthlyAmount: 150_000,
          startedAt: at(5, 1),
        })),
      },
    },
  });
  const roof = await prisma.campaign.create({
    data: {
      slug: 'roof-repair-albaath',
      categoryId: homeRenovation.id,
      titleAr: 'ترميم سقف منزل أسرة في حي البعث',
      titleEn: 'Repairing a family home roof in Al-Baath',
      summaryAr:
        'سقف منزل أسرة من خمسة أفراد تضرر من الأمطار ويحتاج إلى عزل وترميم قبل الشتاء.',
      summaryEn:
        'The roof of a family of five was damaged by rain and needs repair before winter.',
      priority: 'URGENT',
      targetAmount: 7_500_000,
      coverKey: 'home-1',
      area: 'حي البعث',
      status: 'ACTIVE',
      publishedAt: at(2, 1),
      createdAt: at(2, 1),
      createdById: admin.id,
      beneficiaries: { create: [{ beneficiaryId: baathFamily.id, startedAt: at(2, 1) }] },
      // The one per-campaign receiving account override (FAKE), shown on this campaign only.
      paymentAccounts: {
        create: [
          {
            method: 'SYRIATEL_CASH',
            accountName: 'صندوق ترميم حي البعث (مثال)',
            accountNumber: '0930 000 099 (FAKE)',
            note: 'للتبرعات الخاصة بهذه الحملة فقط',
          },
        ],
      },
    },
  });
  const rain = await prisma.campaign.create({
    data: {
      slug: 'rain-damaged-homes',
      categoryId: homeRenovation.id,
      titleAr: 'ترميم منازل متضررة من الأمطار',
      titleEn: 'Repairing homes damaged by the rains',
      summaryAr:
        'ترميم منزلين لأسرتين في حي الوراقة تضررا من أمطار الربيع: جدران وأرضيات وعزل. اكتمل التمويل والصرف مع الفواتير.',
      summaryEn:
        'Repairing two family homes in Al-Warraqa damaged by the spring rains: walls, floors and insulation. Fully funded and spent, with invoices.',
      priority: 'NORMAL',
      targetAmount: 6_000_000,
      coverKey: 'home-2',
      area: 'حي الوراقة',
      // «تم الإنجاز»: fully spent at target, so it no longer accepts pledges.
      status: 'COMPLETED',
      acceptsPledges: false,
      publishedAt: at(5, 1),
      createdAt: at(5, 1),
      createdById: admin.id,
      beneficiaries: {
        create: rainFamilies.map((b) => ({ beneficiaryId: b.id, startedAt: at(5, 1) })),
      },
    },
  });

  // ── Donations ──
  let refNo = 0;
  const nextRef = () => `P-SD${String(++refNo).padStart(4, '0')}`;
  const donorFields = (u: User) => ({
    donorId: u.id,
    donorName: u.fullName,
    donorPhone: u.phone,
  });

  type Via =
    | { kind: 'transfer'; method: PaymentMethod; donor: User }
    | { kind: 'point'; point: CollectionPoint; donor: User }
    | { kind: 'council'; name: string; phone: string };
  interface Verified {
    campaign: Campaign;
    amount: number;
    on: Date;
    via: Via;
    anonymous?: boolean;
  }
  const T = (method: PaymentMethod, d: User): Via => ({ kind: 'transfer', method, donor: d });
  const P = (point: CollectionPoint, d: User): Via => ({ kind: 'point', point, donor: d });
  const C = (name: string, phone: string): Via => ({ kind: 'council', name, phone });
  const V = (campaign: Campaign, amount: number, on: Date, via: Via, anonymous = false) => ({
    campaign,
    amount,
    on,
    via,
    anonymous,
  });

  // Verified money over the last 6 months on every channel: transfers and wallets (Pledge &
  // Verify), donor cash at a collection point, and in-person cash at the council.
  const verified: Verified[] = [
    // Sheikh Badr orphans: 5,200,000
    V(sheikhBadr, 1_500_000, at(5, 3), C('سليم ح. (مثال)', '+963955000111'), true),
    V(sheikhBadr, 1_000_000, at(4, 3), T('BEMO_TRANSFER', donor)),
    V(sheikhBadr, 800_000, at(3, 3), T('SHAM_CASH', diaspora)),
    V(sheikhBadr, 700_000, at(2, 3), P(pointNorth, karim)),
    V(sheikhBadr, 600_000, at(1, 3), T('BANK_TRANSFER', diaspora)),
    V(sheikhBadr, 600_000, at(0, 2), C('هالة م. (مثال)', '+963955000222')),
    // Al-Jammasa orphans: 10,800,000 (FUNDED)
    V(jammasa, 4_000_000, at(5, 4), C('مغتربو السلمية (مثال)', '+963955000333'), true),
    V(jammasa, 2_500_000, at(4, 4), T('BEMO_TRANSFER', diaspora)),
    V(jammasa, 1_800_000, at(3, 4), C('سليم ح. (مثال)', '+963955000111')),
    V(jammasa, 1_500_000, at(2, 4), T('MTN_CASH', rami)),
    V(jammasa, 1_000_000, at(1, 4), P(pointOffice, suad)),
    // Roof repair Al-Baath: 5,000,000
    V(roof, 2_000_000, at(2, 5), T('BEMO_TRANSFER', nour)),
    V(roof, 1_500_000, at(1, 5), C('هالة م. (مثال)', '+963955000222')),
    V(roof, 500_000, at(1, 6), P(pointNorth, waseem)),
    V(roof, 1_000_000, at(0, 2), T('SYRIATEL_CASH', donor)),
    // Rain-damaged homes: 6,000,000 (COMPLETED)
    V(rain, 2_500_000, at(5, 5), C('مغتربو السلمية (مثال)', '+963955000333'), true),
    V(rain, 1_000_000, at(5, 6), T('BEMO_TRANSFER', donor)),
    V(rain, 1_500_000, at(4, 5), P(pointWest, karim)),
    V(rain, 1_000_000, at(4, 6), T('SHAM_CASH', diaspora)),
    // Heart surgery: 7,000,000
    V(heart, 2_000_000, at(3, 6), T('BEMO_TRANSFER', donor)),
    V(heart, 3_500_000, at(2, 6), C('سليم ح. (مثال)', '+963955000111'), true),
    V(heart, 1_000_000, at(1, 7), P(pointNorth, karim)),
    V(heart, 500_000, at(0, 2), T('BANK_TRANSFER', diaspora)),
    // Chronic medication: 2,400,000 (FUNDED)
    V(medication, 1_400_000, at(4, 7), T('BANK_TRANSFER', diaspora)),
    V(medication, 1_000_000, at(3, 7), C('هالة م. (مثال)', '+963955000222')),
    // Chemotherapy: 3,200,000
    V(chemo, 1_500_000, at(2, 7), C('هالة م. (مثال)', '+963955000222')),
    V(chemo, 1_000_000, at(1, 8), T('MTN_CASH', rami)),
    V(chemo, 700_000, at(0, 2), P(pointWest, suad)),
  ];

  /** The channel-specific pledge fields shared by verified and pending pledges. */
  const channelFields = (via: Via) => {
    if (via.kind === 'transfer')
      return { channel: 'PLATFORM' as const, method: via.method, ...donorFields(via.donor) };
    if (via.kind === 'point')
      return {
        channel: 'PLATFORM' as const,
        method: 'CASH' as const,
        collectionPointId: via.point.id,
        recordedById: collectorOf(via.point).id,
        ...donorFields(via.donor),
      };
    return {
      channel: 'COUNCIL' as const,
      method: 'CASH' as const,
      donorName: via.name,
      donorPhone: via.phone,
      recordedById: staff.id,
    };
  };

  /** A transfer receipt image uploaded by the donor (Pledge & Verify). */
  async function transferReceipt(pledgeId: string, amount: number, by: User, on: Date) {
    const img = await placeholderImage('receipts', [
      'TRANSFER RECEIPT',
      `Amount: ${amount.toLocaleString('en-US')} SYP`,
      `Ref: TRX-${pledgeId.slice(0, 6).toUpperCase()}`,
    ]);
    return prisma.receipt.create({
      data: {
        pledgeId,
        transferRef: `TRX-${pledgeId.slice(0, 6).toUpperCase()}`,
        uploadedById: by.id,
        createdAt: on,
        ...img,
      },
    });
  }

  // Oldest first, so official receipt numbers follow the verification dates.
  verified.sort((a, b) => a.on.getTime() - b.on.getTime());
  for (const v of verified) {
    const createdAt = new Date(v.on.getTime() - 86_400_000);
    const pledge = await prisma.pledge.create({
      data: {
        referenceNo: nextRef(),
        campaignId: v.campaign.id,
        isAnonymousDisplay: v.anonymous ?? false,
        amount: v.amount,
        currency: 'SYP',
        status: 'VERIFIED',
        verifiedAt: v.on,
        createdAt,
        officialReceiptNo: await nextReceiptNo(v.on),
        ...channelFields(v.via),
      },
    });
    const receipt =
      v.via.kind === 'transfer'
        ? await transferReceipt(pledge.id, v.amount, v.via.donor, createdAt)
        : null;
    await prisma.verification.create({
      data: {
        pledgeId: pledge.id,
        receiptId: receipt?.id,
        status: 'APPROVED',
        reviewerId: finance.id,
        createdAt,
        decidedAt: v.on,
      },
    });
    await prisma.campaign.update({
      where: { id: v.campaign.id },
      data: { verifiedAmount: { increment: v.amount } },
    });
  }

  // ── Pledges in every other status ──
  const recent = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * 3_600_000);

  // Finance queue (PENDING): a transfer with its receipt, donor cash confirmed by a collector,
  // and council cash recorded by staff.
  const uploaded = await prisma.pledge.create({
    data: {
      referenceNo: nextRef(),
      campaignId: heart.id,
      amount: 1_000_000,
      currency: 'SYP',
      status: 'RECEIPT_UPLOADED',
      createdAt: recent(30),
      ...channelFields(T('BEMO_TRANSFER', diaspora)),
    },
  });
  const uploadedReceipt = await transferReceipt(uploaded.id, 1_000_000, diaspora, recent(28));
  await prisma.verification.create({
    data: {
      pledgeId: uploaded.id,
      receiptId: uploadedReceipt.id,
      status: 'PENDING',
      createdAt: recent(28),
    },
  });
  for (const pending of [
    { campaign: chemo, amount: 300_000, via: P(pointWest, suad), hoursAgo: 20 },
    {
      campaign: roof,
      amount: 250_000,
      via: C('أبو جميل (مثال)', '+963955000444'),
      hoursAgo: 6,
    },
  ]) {
    await prisma.pledge.create({
      data: {
        referenceNo: nextRef(),
        campaignId: pending.campaign.id,
        amount: pending.amount,
        currency: 'SYP',
        status: 'COLLECTED',
        createdAt: recent(pending.hoursAgo + 24),
        ...channelFields(pending.via),
        verifications: { create: { status: 'PENDING', createdAt: recent(pending.hoursAgo) } },
      },
    });
  }

  // Collector queue (PLEDGED cash waiting at a point). The first one is demo step 5; the OFFICE
  // one belongs to the other collector and is not visible to 0900000005.
  for (const cash of [
    { campaign: heart, amount: 200_000, point: pointNorth, d: donor, hoursAgo: 3 },
    { campaign: sheikhBadr, amount: 150_000, point: pointWest, d: nour, hoursAgo: 26 },
    { campaign: jammasa, amount: 100_000, point: pointOffice, d: rami, hoursAgo: 8 },
  ]) {
    await prisma.pledge.create({
      data: {
        referenceNo: nextRef(),
        campaignId: cash.campaign.id,
        amount: cash.amount,
        currency: 'SYP',
        status: 'PLEDGED',
        channel: 'PLATFORM',
        method: 'CASH',
        collectionPointId: cash.point.id,
        createdAt: recent(cash.hoursAgo),
        ...donorFields(cash.d),
      },
    });
  }

  // A transfer pledge still waiting for its receipt.
  await prisma.pledge.create({
    data: {
      referenceNo: nextRef(),
      campaignId: chemo.id,
      amount: 500_000,
      currency: 'SYP',
      status: 'PLEDGED',
      createdAt: recent(48),
      ...channelFields(T('BEMO_TRANSFER', donor)),
    },
  });

  // Rejected by finance (the receipt does not match), and one cancelled by the donor.
  const rejected = await prisma.pledge.create({
    data: {
      referenceNo: nextRef(),
      campaignId: roof.id,
      amount: 600_000,
      currency: 'SYP',
      status: 'REJECTED',
      createdAt: at(1, 9),
      ...channelFields(T('BANK_TRANSFER', waseem)),
    },
  });
  const rejectedReceipt = await transferReceipt(rejected.id, 60_000, waseem, at(1, 9));
  await prisma.verification.create({
    data: {
      pledgeId: rejected.id,
      receiptId: rejectedReceipt.id,
      status: 'REJECTED',
      reason: 'المبلغ في الإيصال لا يطابق التعهد',
      reviewerId: finance.id,
      createdAt: at(1, 9),
      decidedAt: at(1, 10),
    },
  });
  await prisma.pledge.create({
    data: {
      referenceNo: nextRef(),
      campaignId: sheikhBadr.id,
      amount: 100_000,
      currency: 'SYP',
      status: 'CANCELLED',
      channel: 'PLATFORM',
      method: 'CASH',
      collectionPointId: pointNorth.id,
      createdAt: at(1, 12),
      ...donorFields(donor),
    },
  });

  // Simulated payments («Demo»): shown separately, never verified money.
  for (const demo of [
    { campaign: sheikhBadr, amount: 250_000, method: 'SYRIATEL_CASH' as const, d: donor },
    { campaign: roof, amount: 300_000, method: 'VISA' as const, d: diaspora },
    { campaign: heart, amount: 400_000, method: 'SHAM_CASH' as const, d: donor },
    { campaign: jammasa, amount: 200_000, method: 'PAYPAL' as const, d: diaspora },
    { campaign: chemo, amount: 150_000, method: 'MTN_CASH' as const, d: nour },
  ]) {
    const ref = nextRef();
    await prisma.pledge.create({
      data: {
        referenceNo: ref,
        campaignId: demo.campaign.id,
        amount: demo.amount,
        currency: 'SYP',
        status: 'DEMO_CONFIRMED',
        isDemo: true,
        channel: 'PLATFORM',
        method: demo.method,
        officialReceiptNo: `DEMO-${ref}`,
        createdAt: at(1, 15),
        ...donorFields(demo.d),
      },
    });
  }

  // ── Expenditures with public-safe proofs ──
  async function proof(lines: string[], on: Date) {
    const img = await placeholderImage('expenditures', lines);
    return prisma.document.create({
      data: {
        kind: 'EXPENDITURE_PROOF',
        originalName: 'proof.jpg',
        uploadedById: finance.id,
        createdAt: on,
        ...img,
      },
    });
  }
  async function spend(opts: {
    campaign: Campaign;
    payeeType: PayeeType;
    payeeLabel: string;
    amount: number;
    on: Date;
    description: string;
    descriptionEn: string;
    proofLines: string[];
  }) {
    const doc = await proof(opts.proofLines, opts.on);
    await prisma.expenditure.create({
      data: {
        campaignId: opts.campaign.id,
        payeeType: opts.payeeType,
        payeeLabel: opts.payeeLabel,
        hospitalId: opts.payeeType === 'HOSPITAL' ? national.id : null,
        amount: opts.amount,
        currency: 'SYP',
        description: opts.description,
        descriptionEn: opts.descriptionEn,
        paidAt: opts.on,
        proofDocumentId: doc.id,
        proofPublic: true,
        recordedById: finance.id,
        createdAt: opts.on,
      },
    });
    await prisma.campaign.update({
      where: { id: opts.campaign.id },
      data: { spentAmount: { increment: opts.amount } },
    });
  }

  // Monthly orphan sponsorship: every month up to last month is paid; this month is not (step 7).
  async function sponsorshipRuns(
    campaign: Campaign,
    orphans: { id: string; publicCode: string }[],
    monthly: number,
  ) {
    for (let m = 5; m >= 1; m--) {
      const paidAt = at(m, 25);
      const doc = await proof(
        ['SPONSORSHIP TRANSFER', `Period: ${period(m)}`, `${orphans.length} orphans`],
        paidAt,
      );
      await prisma.expenditure.createMany({
        data: orphans.map((o) => ({
          campaignId: campaign.id,
          payeeType: 'BENEFICIARY_FAMILY' as const,
          payeeLabel: o.publicCode,
          beneficiaryId: o.id,
          amount: monthly,
          currency: 'SYP' as const,
          description: `كفالة شهر ${period(m)}`,
          descriptionEn: `Sponsorship for ${period(m)}`,
          paidAt,
          periodMonth: period(m),
          proofDocumentId: doc.id,
          proofPublic: true,
          recordedById: finance.id,
          createdAt: paidAt,
        })),
      });
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { spentAmount: { increment: monthly * orphans.length } },
      });
    }
  }
  await sponsorshipRuns(sheikhBadr, sheikhBadrOrphans, 200_000);
  await sponsorshipRuns(jammasa, jammasaOrphans, 150_000);

  await spend({
    campaign: rain,
    payeeType: 'SUPPLIER',
    payeeLabel: 'مستودع مواد البناء (مثال)',
    amount: 2_500_000,
    on: at(4, 20),
    description: 'مواد بناء وبلاط وعزل لمنزلين',
    descriptionEn: 'Building materials, tiles and insulation for two homes',
    proofLines: ['INVOICE', 'Building materials and tiles', 'Amount: 2,500,000 SYP'],
  });
  await spend({
    campaign: rain,
    payeeType: 'CONTRACTOR',
    payeeLabel: 'ورشة ترميم (مثال)',
    amount: 3_500_000,
    on: at(3, 20),
    description: 'أعمال ترميم الجدران والأرضيات في المنزلين',
    descriptionEn: 'Wall and floor repair works in both homes',
    proofLines: ['CONTRACTOR INVOICE', 'Repair works, 2 homes', 'Amount: 3,500,000 SYP'],
  });
  await spend({
    campaign: roof,
    payeeType: 'SUPPLIER',
    payeeLabel: 'مورد مواد العزل (مثال)',
    amount: 1_800_000,
    on: at(1, 20),
    description: 'مواد عزل وإسمنت لسقف المنزل',
    descriptionEn: 'Insulation and cement for the roof',
    proofLines: ['INVOICE', 'Roof insulation and cement', 'Amount: 1,800,000 SYP'],
  });
  for (const m of [3, 2, 1]) {
    await spend({
      campaign: medication,
      payeeType: 'HOSPITAL',
      payeeLabel: national.nameAr,
      amount: 400_000,
      on: at(m, 22),
      description: `أدوية شهر ${period(m)}`,
      descriptionEn: `Medication for ${period(m)}`,
      proofLines: ['HOSPITAL INVOICE', `Medication ${period(m)}`, 'Amount: 400,000 SYP'],
    });
  }
  await spend({
    campaign: chemo,
    payeeType: 'HOSPITAL',
    payeeLabel: national.nameAr,
    amount: 800_000,
    on: at(1, 22),
    description: 'الجرعة الأولى والتحاليل',
    descriptionEn: 'First dose and tests',
    proofLines: ['HOSPITAL INVOICE', 'Chemotherapy dose 1 + tests', 'Amount: 800,000 SYP'],
  });

  await prisma.campaignUpdate.createMany({
    data: [
      {
        campaignId: heart.id,
        authorId: caseOfficer.id,
        bodyAr: 'تم تحديد موعد العملية مبدئياً. شكراً لكل من ساهم.',
        bodyEn: 'The surgery has been tentatively scheduled. Thank you to all contributors.',
        createdAt: at(0, 2, 12),
      },
      {
        campaignId: rain.id,
        authorId: admin.id,
        bodyAr:
          'تم الانتهاء من ترميم المنزلين وعادت الأسرتان إليهما. الفواتير منشورة في سجل الصرف.',
        bodyEn:
          'Both homes are repaired and the families are back. The invoices are in the spending log.',
        createdAt: at(3, 21),
      },
    ],
  });

  // ── Consistency checks: the seed must satisfy the same rules as the app ──
  const all = await prisma.campaign.findMany();
  for (const c of all) {
    if (c.spentAmount.greaterThan(c.verifiedAmount))
      throw new Error(`seed: ${c.slug} spends more than it verified`);
    if (c.status === 'FUNDED' && c.verifiedAmount.lessThan(c.targetAmount))
      throw new Error(`seed: ${c.slug} is FUNDED below target`);
    if (c.status === 'COMPLETED' && c.spentAmount.lessThan(c.targetAmount))
      throw new Error(`seed: ${c.slug} is COMPLETED below target`);
  }

  const statuses = await prisma.pledge.groupBy({ by: ['status'], _count: { _all: true } });
  console.log('Seed done:', {
    users: await prisma.user.count(),
    campaigns: all.length,
    beneficiaries: await prisma.beneficiary.count(),
    expenditures: await prisma.expenditure.count(),
    pledges: Object.fromEntries(statuses.map((s) => [s.status, s._count._all])),
    pendingVerifications: await prisma.verification.count({ where: { status: 'PENDING' } }),
  });
  console.log(`Hourani hospital id (for the 15 → 25 million extra): ${hourani.id}`);
  console.log('Demo logins (fictional; password = SEED_PASSWORD in prisma/seed.ts):');
  for (const u of [admin, caseOfficer, finance, staff, collector, donor, diaspora]) {
    console.log(`  ${u.role.padEnd(16)} ${u.phone}`);
  }
  // Real team numbers are never printed: only how many alert donors use them.
  console.log(
    realNumbers.length > 0
      ? `  WhatsApp alert donors: ${realNumbers.length} from DEMO_WHATSAPP_NUMBERS (numbers not printed)`
      : `  WhatsApp alert donors: ${alertPhones.join(', ')} (fictional; DEMO_WHATSAPP_NUMBERS is empty)`,
  );
}

main()
  .catch((e: unknown) => {
    console.error(
      e instanceof Prisma.PrismaClientKnownRequestError ? `${e.code}: ${e.message}` : e,
    );
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
