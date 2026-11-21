/**
 * Fictional development/demo data — nothing here is real.
 * 5 medical cases (2 anonymous) + an ongoing campaign + one user per role + Pledge & Verify scenarios.
 *
 * Run: npm run seed (refuses to run unless DATABASE_URL is the local majlis_fund database).
 */
import {
  PrismaClient,
  Prisma,
  type CaseCategory,
  type Priority,
  type Role,
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

/** كلمة مرور تجريبية موحّدة لكل حسابات الـseed (تطوير فقط). */
export const SEED_PASSWORD = 'Majlis@2026';

const prisma = new PrismaClient();
const uploadsRoot = resolve(process.env.STORAGE_LOCAL_DIR ?? 'uploads');
const hmacKey = process.env.NATIONAL_ID_HMAC_KEY ?? 'dev-national-id-key-change-me';

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

async function nextReceiptNo(): Promise<string> {
  const [row] = await prisma.$queryRaw<
    { nextval: bigint }[]
  >`SELECT nextval('official_receipt_seq')`;
  return `R-${new Date().getFullYear()}-${String(Number(row?.nextval ?? 0)).padStart(6, '0')}`;
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
    prisma.auditLog.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.receipt.deleteMany(),
    prisma.pledge.deleteMany(),
    prisma.disbursement.deleteMany(),
    prisma.campaignUpdate.deleteMany(),
    prisma.campaign.deleteMany(),
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

async function main() {
  await reset();
  const passwordHash = await hash(SEED_PASSWORD, 10);

  // ── مستخدم لكل دور ──
  const mkUser = (fullName: string, phone: string, role: Role, locale: 'ar' | 'en' = 'ar') =>
    prisma.user.create({ data: { fullName, phone, role, locale, passwordHash } });
  const admin = await mkUser('مدير النظام', '+963900000001', 'ADMIN');
  const caseOfficer = await mkUser(
    'مدقق الحالات (هيئة الإنعاش)',
    '+963900000002',
    'CASE_OFFICER',
  );
  const finance = await mkUser('المدقق المالي', '+963900000003', 'FINANCE_VERIFIER');
  const staff = await mkUser('موظف المجلس المحلي', '+963900000004', 'STAFF');
  const collector = await mkUser('مسؤول نقاط الجمع', '+963900000005', 'COLLECTOR');
  const donor = await mkUser('متبرع تجريبي', '+963900000006', 'DONOR');
  const diaspora = await mkUser('Diaspora Donor', '+4915100000007', 'DONOR', 'en');

  // ── مشافي (تجريبية — تُستبدل بقائمة المجلس، سؤال Q10) ──
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

  // ── Collection points (fictional). The contact person is not a user; the COLLECTOR is linked to both. ──
  const pointNorth = await prisma.collectionPoint.create({
    data: {
      name: 'نقطة جمع الحي الشمالي',
      type: 'CENTER',
      contactName: 'أبو فادي (مثال)',
      area: 'الحي الشمالي',
      collectors: { connect: { id: collector.id } },
    },
  });
  await prisma.collectionPoint.create({
    data: {
      name: 'نقطة جمع الحي الغربي',
      type: 'MOSQUE',
      contactName: 'أبو نزار (مثال)',
      area: 'الحي الغربي',
      collectors: { connect: { id: collector.id } },
    },
  });

  // ── 5 حالات طبية ──
  interface SeedCase {
    name: string;
    phone: string;
    nid: string;
    category: CaseCategory;
    description: string;
    amount: number;
    priority: Priority;
    hospitalId: string;
    doctor: string;
    anonymous: boolean;
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    otherPrograms?: string[];
    publish: boolean;
  }
  const cases: SeedCase[] = [
    {
      name: 'م. ع.',
      phone: '+963933100201',
      nid: '04010100201',
      category: 'SURGERY',
      description:
        'رب أسرة يحتاج عملية قلب مفتوح عاجلة. التقرير من المشفى الوطني، والتكلفة المعتمدة 15 مليون.',
      amount: 15_000_000,
      priority: 'VERY_URGENT',
      hospitalId: national.id,
      doctor: 'د. سامر (مثال)',
      anonymous: true,
      titleAr: 'عملية قلب مفتوح عاجلة لرب أسرة',
      titleEn: 'Urgent open-heart surgery for a father',
      summaryAr:
        'رب أسرة من السلمية يحتاج عملية قلب مفتوح خلال أسبوعين. الحالة مدققة من هيئة الإنعاش والطبيب المعتمد، والصرف مباشرة للمشفى الوطني.',
      summaryEn:
        'A father from Salamiyah needs open-heart surgery within two weeks. Vetted by the welfare board; funds go directly to the National Hospital.',
      publish: true,
    },
    {
      name: 'ر. ح.',
      phone: '+963933100202',
      nid: '04010100202',
      category: 'INCUBATOR',
      description: 'مولود خديج يحتاج حاضنة لمدة 3 أسابيع.',
      amount: 4_500_000,
      priority: 'URGENT',
      hospitalId: national.id,
      doctor: 'د. ريم (مثال)',
      anonymous: true,
      titleAr: 'حاضنة لمولود خديج',
      titleEn: 'Incubator care for a premature newborn',
      summaryAr:
        'مولود خديج يحتاج حاضنة لمدة ثلاثة أسابيع. الأسرة غير قادرة على تغطية التكلفة.',
      summaryEn:
        'A premature newborn needs three weeks of incubator care. The family cannot cover the cost.',
      otherPrograms: ['الرعاية الاجتماعية'],
      publish: true,
    },
    {
      name: 'أبو سمير',
      phone: '+963933100203',
      nid: '04010100203',
      category: 'MEDICATION',
      description: 'أدوية مزمنة لمدة 6 أشهر (بموافقة المستفيد على النشر باسمه).',
      amount: 2_400_000,
      priority: 'NORMAL',
      hospitalId: national.id,
      doctor: 'د. سامر (مثال)',
      anonymous: false,
      titleAr: 'أدوية مزمنة لأبي سمير لستة أشهر',
      titleEn: 'Six months of chronic medication for Abu Samir',
      summaryAr:
        'أبو سمير يحتاج أدوية مزمنة شهرية. وافق على نشر حالته باسمه لتشجيع المتبرعين.',
      summaryEn:
        'Abu Samir needs monthly chronic medication and agreed to share his case by name.',
      publish: true,
    },
    {
      name: 'أم خالد',
      phone: '+963933100204',
      nid: '04010100204',
      category: 'ONCOLOGY',
      description: 'جرعات علاج كيميائي وتحاليل لمدة 3 أشهر.',
      amount: 8_000_000,
      priority: 'URGENT',
      hospitalId: national.id,
      doctor: 'د. ريم (مثال)',
      anonymous: false,
      titleAr: 'جرعات علاج كيميائي لأم خالد',
      titleEn: 'Chemotherapy doses for Um Khaled',
      summaryAr: 'أم خالد تحتاج جرعات علاج كيميائي وتحاليل لثلاثة أشهر. وافقت على نشر حالتها.',
      summaryEn:
        'Um Khaled needs three months of chemotherapy and tests, and agreed to share her case.',
      publish: true,
    },
    {
      name: 'س. ن.',
      phone: '+963933100205',
      nid: '04010100205',
      category: 'SURGERY',
      description: 'كسر في الحوض يحتاج عملية تثبيت. بانتظار تقييم هيئة الإنعاش.',
      amount: 6_000_000,
      priority: 'URGENT',
      hospitalId: national.id,
      doctor: '',
      anonymous: false,
      titleAr: '',
      titleEn: '',
      summaryAr: '',
      summaryEn: '',
      publish: false,
    },
  ];

  const campaigns: { id: string; slug: string; caseId: string | null }[] = [];
  let i = 0;
  for (const c of cases) {
    i += 1;
    const report = await placeholderImage('cases', [
      'MEDICAL REPORT',
      `Case #${i}`,
      `Category: ${c.category}`,
    ]);
    const beneficiary = await prisma.beneficiary.create({
      data: {
        fullName: c.name,
        phone: c.phone,
        localCouncil: 'المجلس المحلي - السلمية',
        otherPrograms: c.otherPrograms ?? [],
        ...nationalId(c.nid),
      },
    });
    const created = await prisma.case.create({
      data: {
        trackingNo: `MF-2026-DEMO${i}`,
        beneficiaryId: beneficiary.id,
        category: c.category,
        description: c.description,
        requestedAmount: c.amount,
        submittedById: staff.id,
        slaDueAt: new Date(Date.now() + (c.publish ? 7 : -2) * 86_400_000), // الحالة 5 متأخرة (SLA)
        ...(c.publish
          ? {
              status: 'PUBLISHED',
              priority: c.priority,
              route: 'CROWDFUNDING',
              hospitalId: c.hospitalId,
              doctorName: c.doctor,
              approvedAmount: c.amount,
              isAnonymous: c.anonymous,
              redactedSummary: c.summaryAr,
              reviewedById: caseOfficer.id,
              reviewedAt: new Date(),
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
    if (c.publish) {
      const campaign = await prisma.campaign.create({
        data: {
          slug: `${c.category.toLowerCase()}-demo${i}`,
          caseId: created.id,
          titleAr: c.titleAr,
          titleEn: c.titleEn,
          summaryAr: c.summaryAr,
          summaryEn: c.summaryEn,
          priority: c.priority,
          targetAmount: c.amount,
          hospitalId: c.hospitalId,
          status: 'ACTIVE',
          publishedAt: new Date(Date.now() - i * 3_600_000),
          createdById: caseOfficer.id,
        },
      });
      campaigns.push({ id: campaign.id, slug: campaign.slug, caseId: created.id });
    }
  }

  // ── حملة مستمرة: برنامج مرضى السرطان (600 مريض) ──
  const ongoing = await prisma.campaign.create({
    data: {
      slug: 'oncology-program',
      isOngoing: true,
      titleAr: 'دعم جرعات ونقل مرضى السرطان',
      titleEn: 'Chemotherapy & transport for cancer patients',
      summaryAr:
        'برنامج مستمر يخدم قرابة 600 مريض سرطان في السلمية: تحاليل وجرعات حسب الوضع المادي، ونقل للعلاج.',
      summaryEn:
        'An ongoing programme serving about 600 cancer patients in Salamiyah: tests, doses and transport.',
      priority: 'URGENT',
      targetAmount: 50_000_000,
      status: 'ACTIVE',
      publishedAt: new Date(Date.now() - 10 * 86_400_000),
      createdById: admin.id,
    },
  });

  // ── تعهدات بكل الحالات ──
  const [heart, incubator, medication] = campaigns;
  if (!heart || !incubator || !medication) throw new Error('seed campaigns missing');

  async function verifiedPledge(opts: {
    campaignId: string;
    amount: number;
    channel: 'PLATFORM' | 'COUNCIL' | 'COLLECTOR';
    donorId?: string;
    donorName?: string;
    donorPhone?: string;
    anonymous?: boolean;
  }) {
    const receiptNo = opts.channel === 'COLLECTOR' ? null : await nextReceiptNo();
    const p = await prisma.pledge.create({
      data: {
        referenceNo: `P-SEED${randomUUID().slice(0, 5).toUpperCase()}`,
        campaignId: opts.campaignId,
        donorId: opts.donorId,
        donorName: opts.donorName,
        donorPhone: opts.donorPhone,
        isAnonymousDisplay: opts.anonymous ?? false,
        amount: opts.amount,
        currency: 'SYP',
        channel: opts.channel,
        method: opts.channel === 'PLATFORM' ? 'BEMO_TRANSFER' : 'CASH',
        status: 'VERIFIED',
        verifiedAt: new Date(),
        officialReceiptNo: receiptNo,
        recordedById:
          opts.channel === 'PLATFORM'
            ? undefined
            : opts.channel === 'COLLECTOR'
              ? collector.id
              : staff.id,
        collectionPointId: opts.channel === 'COLLECTOR' ? pointNorth.id : undefined,
        verifications: {
          create: { status: 'APPROVED', reviewerId: finance.id, decidedAt: new Date() },
        },
      },
    });
    await prisma.campaign.update({
      where: { id: opts.campaignId },
      data: { verifiedAmount: { increment: opts.amount } },
    });
    return p;
  }

  // متحقق منها
  await verifiedPledge({
    campaignId: heart.id,
    amount: 2_000_000,
    channel: 'PLATFORM',
    donorId: donor.id,
    donorName: donor.fullName,
    donorPhone: donor.phone,
  });
  await verifiedPledge({
    campaignId: heart.id,
    amount: 3_500_000,
    channel: 'COUNCIL',
    donorName: 'سليم ح. (مثال)',
    donorPhone: '+963955000111',
    anonymous: true,
  });
  await verifiedPledge({
    campaignId: incubator.id,
    amount: 1_500_000,
    channel: 'COUNCIL',
    donorName: 'هالة م. (مثال)',
    donorPhone: '+963955000222',
  });
  await verifiedPledge({
    campaignId: medication.id,
    amount: 2_400_000,
    channel: 'PLATFORM',
    donorId: diaspora.id,
    donorName: diaspora.fullName,
    donorPhone: diaspora.phone,
  });
  await prisma.campaign.update({ where: { id: medication.id }, data: { status: 'FUNDED' } });
  await verifiedPledge({ campaignId: ongoing.id, amount: 3_000_000, channel: 'COLLECTOR' });

  // بانتظار التحقق: إيصال مرفوع من المغترب
  const receiptImg = await placeholderImage('receipts', [
    'BANK BEMO — TRANSFER',
    'Amount: 1,000,000 SYP',
    'Ref: TRX-559201',
  ]);
  const pendingReceiptPledge = await prisma.pledge.create({
    data: {
      referenceNo: 'P-SEEDRCPT',
      campaignId: heart.id,
      donorId: diaspora.id,
      donorName: diaspora.fullName,
      donorPhone: diaspora.phone,
      amount: 1_000_000,
      currency: 'SYP',
      channel: 'PLATFORM',
      method: 'BEMO_TRANSFER',
      status: 'RECEIPT_UPLOADED',
    },
  });
  const receipt = await prisma.receipt.create({
    data: {
      pledgeId: pendingReceiptPledge.id,
      transferRef: 'TRX-559201',
      uploadedById: diaspora.id,
      ...receiptImg,
    },
  });
  await prisma.verification.create({
    data: { pledgeId: pendingReceiptPledge.id, receiptId: receipt.id, status: 'PENDING' },
  });

  // بانتظار التحقق: حصيلة صندوق نقطة جمع (بلا أسماء)
  await prisma.pledge.create({
    data: {
      referenceNo: 'P-SEEDBOX1',
      campaignId: heart.id,
      isAnonymousDisplay: true,
      amount: 750_000,
      currency: 'SYP',
      channel: 'COLLECTOR',
      method: 'CASH',
      status: 'COLLECTED',
      collectionPointId: pointNorth.id,
      recordedById: collector.id,
      verifications: { create: { status: 'PENDING' } },
    },
  });

  // تعهد بانتظار رفع الإيصال
  await prisma.pledge.create({
    data: {
      referenceNo: 'P-SEEDWAIT',
      campaignId: incubator.id,
      donorId: donor.id,
      donorName: donor.fullName,
      donorPhone: donor.phone,
      amount: 500_000,
      currency: 'SYP',
      channel: 'PLATFORM',
      method: 'BEMO_TRANSFER',
      status: 'PLEDGED',
    },
  });

  await prisma.campaignUpdate.create({
    data: {
      campaignId: heart.id,
      authorId: caseOfficer.id,
      bodyAr: 'تم تحديد موعد العملية مبدئياً. شكراً لكل من ساهم.',
      bodyEn: 'The surgery has been tentatively scheduled. Thank you to all contributors.',
    },
  });

  const counts = {
    users: await prisma.user.count(),
    cases: await prisma.case.count(),
    anonymousCases: await prisma.case.count({
      where: { isAnonymous: true, status: 'PUBLISHED' },
    }),
    campaigns: await prisma.campaign.count(),
    pledges: await prisma.pledge.count(),
    pendingVerifications: await prisma.verification.count({ where: { status: 'PENDING' } }),
  };
  console.log('Seed done:', counts);
  console.log(`Hourani hospital id (for the 15 → 25 million demo): ${hourani.id}`);
  console.log('Demo logins (fictional; password = SEED_PASSWORD in prisma/seed.ts):');
  for (const u of [admin, caseOfficer, finance, staff, collector, donor, diaspora]) {
    console.log(`  ${u.role.padEnd(16)} ${u.phone}`);
  }
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
