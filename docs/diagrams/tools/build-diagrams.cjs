// Builds the submission diagrams as SVG (source of truth) and PNG (for Word/PDF) in docs/diagrams/.
// Every box, field and route comes from the real code: api/prisma/schema.prisma, api/src controllers and
// services, web/src/app and mobile/src/app. Labels are English + Arabic.
//
// No new dependencies: SVG is written by hand (tools/svg.cjs); PNG is rendered by the installed Google Chrome
// through the Playwright already installed in e2e/ (pass --playwright <dir> to use another install), with the
// IBM Plex Sans Arabic font from mobile/node_modules when present.
//
// Usage (from the repository root): node docs/diagrams/tools/build-diagrams.cjs [--svg-only]
'use strict';
const fs = require('fs');
const path = require('path');
const { C, text, lines, rect, box, arrow, tag, svg } = require('./svg.cjs');

const root = path.resolve(__dirname, '../../..');
const outDir = path.resolve(__dirname, '..');
const diagrams = {};

// ───────────────────────── 1. Architecture ─────────────────────────
diagrams.architecture = () => {
  const W = 1640;
  const H = 900;
  let b = '';
  b += text(W / 2, 40, 'Majlis Fund — system architecture · معمارية النظام', { size: 24, weight: 700, fill: C.greenDark });

  // Clients
  b += rect(30, 80, 330, 560, { fill: C.greyBg, stroke: C.border, dash: '6 5' });
  b += text(195, 108, 'Clients · العملاء', { size: 16, weight: 700, fill: C.muted });
  b += box(55, 130, 280, 150, ['Web browser', 'متصفح الويب', { text: 'public site · donate · transparency', size: 11.5, fill: C.muted }, { text: 'staff / admin dashboard', size: 11.5, fill: C.muted }], { fill: C.white });
  b += box(55, 300, 280, 120, ['Collector PWA («مكي» / Mukhi)', 'تطبيق المكي (PWA)', { text: 'cash confirmation, installable', size: 11.5, fill: C.muted }], { fill: C.white });
  b += box(55, 440, 280, 170, ['Donor mobile app', 'تطبيق المتبرع', { text: 'React Native · Expo SDK 58', size: 12, weight: 600, fill: C.green }, { text: 'expo-router · SecureStore token', size: 11.5, fill: C.muted }, { text: 'mobile/', size: 11.5, fill: C.muted }], { fill: C.white, stroke: C.green });

  // Next.js server
  b += rect(440, 80, 360, 380, { fill: C.blueBg, stroke: C.blue });
  b += lines(620, 120, ['Next.js 15 server (web/)', 'خادم Next.js'], { size: 16, weight: 700, fill: C.blue });
  b += box(465, 160, 310, 60, ['Server Components — reads', 'قراءة من الخادم'], { text: { size: 12.5 } });
  b += box(465, 232, 310, 60, ['Server Actions — writes', 'كتابة عبر Server Actions'], { text: { size: 12.5 } });
  b += box(465, 304, 310, 60, ['HttpOnly "session" cookie (JWT, 8h)', 'الجلسة في cookie محمي'], { text: { size: 12.5 } });
  b += box(465, 376, 310, 60, ['lib/api/client.ts apiFetch (server-only)', 'لا اتصال بالـAPI من المتصفح'], { text: { size: 12.5 } });

  // NestJS
  b += rect(880, 80, 400, 640, { fill: C.greenBg, stroke: C.green });
  b += lines(1080, 120, ['NestJS 10 API (api/) · :4000', 'واجهة NestJS البرمجية'], { size: 16, weight: 700, fill: C.greenDark });
  const nest = [
    ['Controllers (16) — HTTP in', 'المتحكمات'],
    ['ValidationPipe + DTOs (class-validator)', 'التحقق من المدخلات'],
    ['JwtAuthGuard (passport-jwt) + Throttler', 'الحماية وتحديد المعدل'],
    ['Services + RoleAccessService.requireRole', 'قواعد العمل والأدوار'],
    ['PrismaService ($transaction)', 'الوصول للبيانات'],
  ];
  nest.forEach((l, i) => {
    b += box(905, 155 + i * 70, 350, 58, l, { text: { size: 12.5 } });
    if (i) b += arrow([[1080, 155 + i * 70 - 12], [1080, 155 + i * 70]], { color: C.green, markerId: 'arrowGreen' });
  });
  b += box(905, 515, 170, 62, ['AuditService', 'سجل التدقيق'], { text: { size: 12 } });
  b += box(1085, 515, 170, 62, ['StorageService', 'فحص وتخزين الملفات'], { text: { size: 12 } });
  b += box(905, 587, 170, 62, ['Notifications', 'الإشعارات'], { text: { size: 12 } });
  b += box(1085, 587, 170, 62, ['WhatsApp outbox', 'صندوق رسائل واتساب'], { text: { size: 12 } });
  b += box(905, 659, 350, 50, ['Swagger UI: /api/docs', 'توثيق الواجهة البرمجية'], { text: { size: 12, weight: 600, fill: C.green } });

  // Data stores and outside world
  b += box(1360, 120, 250, 120, ['PostgreSQL 18 (local)', 'قاعدة البيانات', { text: '21 tables · Prisma 5.22 migrations', size: 11.5, fill: C.muted }], { fill: C.amberBg, stroke: C.amber });
  b += box(1360, 290, 250, 130, ['File storage (uploads/)', 'تخزين الملفات', { text: 'receipts · proofs · case documents', size: 11.5, fill: C.muted }, { text: 'magic bytes · EXIF stripped · sha256', size: 11.5, fill: C.muted }], { fill: C.amberBg, stroke: C.amber });
  b += box(1360, 470, 250, 140, ['WhatsApp (council phone)', 'واتساب من هاتف المجلس', { text: 'staff taps a wa.me link', size: 11.5, fill: C.muted }, { text: 'no WhatsApp API · لا API', size: 11.5, weight: 600, fill: C.red }], { fill: C.white, stroke: C.grey, dash: '6 4' });
  b += box(1360, 650, 250, 90, ['Google OAuth (optional)', 'تسجيل Google اختياري', { text: 'off unless GOOGLE_* set', size: 11.5, fill: C.muted }], { fill: C.white, stroke: C.grey, dash: '6 4' });

  // Arrows
  b += arrow([[335, 205], [465, 205]], { color: C.blue, markerId: 'arrowBlue' });
  b += tag(400, 186, ['HTTPS pages', 'صفحات'], { size: 10.5 });
  b += arrow([[335, 360], [400, 360], [400, 260], [465, 260]], { color: C.blue, markerId: 'arrowBlue' });
  b += arrow([[775, 406], [905, 185]], { color: C.blue, markerId: 'arrowBlue' });
  b += tag(840, 330, ['REST + JSON', 'Bearer JWT', 'server → API'], { size: 10.5 });
  b += arrow([[335, 525], [840, 525], [840, 200], [905, 200]], { color: C.green, markerId: 'arrowGreen' });
  b += tag(600, 525, ['REST + JSON · Authorization: Bearer (EXPO_PUBLIC_API_URL)', 'التطبيق يتصل بالـAPI مباشرة'], { size: 10.5 });
  b += arrow([[1255, 464], [1310, 464], [1310, 180], [1360, 180]], { color: C.amber, markerId: 'arrowAmber' });
  b += tag(1310, 300, ['Prisma'], { size: 10.5 });
  b += arrow([[1255, 546], [1330, 546], [1330, 355], [1360, 355]], { color: C.amber, markerId: 'arrowAmber' });
  b += arrow([[1255, 618], [1300, 618], [1300, 540], [1360, 540]], { color: C.grey, dash: '5 4' });
  b += tag(1300, 585, ['wa.me link', 'رابط'], { size: 10.5 });
  b += arrow([[1255, 690], [1360, 690]], { color: C.grey, dash: '5 4' });
  b += tag(1310, 708, ['optional OAuth'], { size: 10.5 });

  // Legend / notes
  b += rect(30, 760, 1580, 110, { fill: C.greyBg, stroke: C.border });
  b += text(50, 790, 'Notes · ملاحظات', { size: 14, weight: 700, anchor: 'start' });
  b += text(50, 815, 'Browsers never hold the JWT or call the API: the Next.js server does (HttpOnly cookie). The Expo app keeps its token in SecureStore and calls the API directly.', { size: 12, anchor: 'start', fill: C.muted });
  b += text(1590, 838, 'المتصفح لا يحمل التوكن ولا يتصل بالـAPI؛ خادم Next.js يفعل ذلك. تطبيق Expo يحفظ التوكن في SecureStore ويتصل بالـAPI مباشرة.', { size: 12, anchor: 'end', dir: 'rtl', fill: C.muted });
  b += text(50, 860, 'All receiving accounts, phone numbers and seed data are fictional for the hackathon. Simulated e-payments carry a «Demo» badge and never count as verified money.', { size: 12, anchor: 'start', fill: C.muted });
  return svg(W, H, b, 'Architecture');
};

// ───────────────────────── 2. ERD ─────────────────────────
const ENT = {
  User: ['المستخدم', ['PK id', 'UQ phone · email · googleSub', 'UQ donorCode', 'role (Role enum)', 'passwordHash (bcrypt)', 'isActive · whatsappOptIn', '↔ CollectionPoint (m:n collectors)']],
  CampaignPaymentAccount: ['حساب استلام خاص بالحملة', ['PK id', 'FK campaignId → Campaign', 'UQ (campaignId, method)', 'accountName · accountNumber (fake)']],
  CampaignCategory: ['فئة الحملة', ['PK id', 'UQ code', 'requiresMedicalCase', 'lockedPayeeHospital', 'supportsMonthlySponsorship', 'isSystem · isActive · sortOrder']],
  Document: ['مستند', ['PK id', 'UQ storageKey', 'FK caseId → Case', 'FK uploadedById → User', 'sha256 · mimeType · sizeBytes']],
  Hospital: ['المشفى', ['PK id', 'nameAr · nameEn · city', 'isPrivate · isActive']],
  CampaignUpdate: ['تحديث الحملة', ['PK id', 'FK campaignId → Campaign', 'FK authorId → User', 'bodyAr · bodyEn']],
  Campaign: ['الحملة', ['PK id', 'UQ slug', 'FK categoryId → CampaignCategory', 'FK caseId → Case (UQ, 1:1)', 'FK hospitalId → Hospital', 'FK createdById → User', 'targetAmount · verifiedAmount', 'spentAmount · status · priority']],
  Expenditure: ['الصرف', ['PK id', 'FK campaignId → Campaign', 'FK hospitalId → Hospital', 'FK beneficiaryId → Beneficiary', 'FK proofDocumentId → Document', 'FK recordedById → User', 'UQ (campaignId, beneficiaryId, periodMonth)', 'payeeType · amount · proofPublic']],
  Case: ['الحالة الطبية', ['PK id', 'UQ trackingNo', 'FK beneficiaryId → Beneficiary', 'FK hospitalId → Hospital', 'FK submittedById → User', 'FK reviewedById → User', 'status · priority · approvedAmount']],
  BeneficiaryNote: ['ملاحظة على مستفيد', ['PK id', 'FK beneficiaryId → Beneficiary', 'FK authorId → User', 'kind · body']],
  CollectionPoint: ['نقطة الجمع', ['PK id', 'type (MOSQUE, CENTER, …)', 'name · area · contactName', 'isActive', '↔ User (collectors, m:n)']],
  Pledge: ['التبرع (التعهد)', ['PK id', 'UQ referenceNo', 'UQ officialReceiptNo (R-YYYY-NNNNNN)', 'FK campaignId → Campaign', 'FK donorId → User', 'FK recordedById → User', 'FK collectionPointId → CollectionPoint', 'amount · method · channel', 'status · isDemo']],
  CampaignBeneficiary: ['ربط الحملة بالمستفيد', ['PK id', 'FK campaignId → Campaign', 'FK beneficiaryId → Beneficiary', 'UQ (campaignId, beneficiaryId)', 'monthlyAmount · startedAt']],
  Beneficiary: ['المستفيد', ['PK id', 'UQ publicCode (B-XXXX)', 'FK importJobId → ImportJob', 'kind · area', 'nationalIdHash (HMAC) · last4', 'fullName · phone (private)', 'isSuspended']],
  ImportJob: ['مهمة استيراد', ['PK id', 'FK createdById → User', 'status · fileName', 'totalRows · validRows · errorRows']],
  PaymentMethodConfig: ['إعداد طريقة الدفع', ['PK id', 'UQ method (PaymentMethod)', 'kind · labelAr · labelEn', 'accountName · accountNumber (fake)', 'allowsReceiptUpload · allowsDemoCheckout']],
  Receipt: ['إيصال التحويل', ['PK id', 'UQ storageKey', 'FK pledgeId → Pledge', 'FK uploadedById → User', 'sha256 · transferRef']],
  Verification: ['التحقق المالي', ['PK id', 'FK pledgeId → Pledge', 'FK receiptId → Receipt', 'FK reviewerId → User', 'status (PENDING/APPROVED/REJECTED)', 'reason · decidedAt']],
  Notification: ['إشعار داخل التطبيق', ['PK id', 'FK userId → User', 'type · title · body', 'link · readAt']],
  OutboundMessage: ['رسالة صادرة (واتساب)', ['PK id', 'FK userId → User', 'phone · template · body', 'link (wa.me) · status', 'relatedType · relatedId']],
  AuditLog: ['سجل التدقيق', ['PK id', 'FK actorId → User', 'action · entityType · entityId', 'before · after (JSON)']],
};

diagrams.erd = () => {
  const W = 1900;
  const colX = [20, 395, 770, 1145, 1520];
  const BW = 330;
  const LH = 17;
  const HEAD = 46;
  const layout = [
    ['CampaignPaymentAccount', 'CampaignCategory', 'Document', 'Hospital', 'User'],
    ['CampaignUpdate', 'Campaign', 'Expenditure', 'Case', 'BeneficiaryNote'],
    ['CollectionPoint', 'Pledge', 'CampaignBeneficiary', 'Beneficiary', 'ImportJob'],
    ['PaymentMethodConfig', 'Receipt', 'Verification', 'Notification', 'OutboundMessage'],
    [null, null, null, 'AuditLog', null],
  ];
  const hOf = (n) => HEAD + ENT[n][1].length * LH + 12;
  const pos = {};
  let y = 80;
  for (const row of layout) {
    const rowH = Math.max(...row.filter(Boolean).map(hOf));
    row.forEach((n, c) => {
      if (n) pos[n] = { x: colX[c], y, w: BW, h: hOf(n) };
    });
    y += rowH + 62;
  }
  const H = y + 40;
  let b = '';
  b += text(W / 2, 40, 'Entity-relationship diagram (api/prisma/schema.prisma) · مخطط الكيانات والعلاقات', { size: 24, weight: 700, fill: C.greenDark });
  b += text(W / 2, 64, '21 models · every PK is a UUID (@default(uuid()) @db.Uuid) · money = Decimal(14,2) · 1 — N shown on each relation', { size: 13, fill: C.muted });

  const P = (n, side, t = 0.5) => {
    const p = pos[n];
    if (side === 'top') return [p.x + p.w * t, p.y];
    if (side === 'bottom') return [p.x + p.w * t, p.y + p.h];
    if (side === 'left') return [p.x, p.y + p.h * t];
    return [p.x + p.w, p.y + p.h * t];
  };
  const rels = [];
  const rel = (pts, a, z, o = {}) => rels.push({ pts, a, z, o });
  // a = cardinality at the first point, z = at the last point
  rel([P('Campaign', 'top'), P('CampaignCategory', 'bottom')], 'N', '1');
  rel([P('Campaign', 'left', 0.15), [360, P('Campaign', 'left', 0.15)[1]], [360, P('CampaignPaymentAccount', 'bottom', 0.8)[1] + 30], [P('CampaignPaymentAccount', 'bottom', 0.8)[0], P('CampaignPaymentAccount', 'bottom', 0.8)[1] + 30], P('CampaignPaymentAccount', 'bottom', 0.8)], '1', 'N');
  rel([P('Campaign', 'left', 0.5), P('CampaignUpdate', 'right', 0.4)], '1', 'N');
  rel([P('Campaign', 'bottom'), P('Pledge', 'top')], '1', 'N');
  rel([P('Campaign', 'right', 0.3), P('Expenditure', 'left', 0.3)], '1', 'N');
  rel([P('Campaign', 'bottom', 0.9), P('CampaignBeneficiary', 'top', 0.2)], '1', 'N');
  const ch1 = pos.Campaign.y - 18;
  const ch2 = pos.Campaign.y - 34;
  rel([P('Campaign', 'top', 0.85), [P('Campaign', 'top', 0.85)[0], ch1], [P('Case', 'top', 0.5)[0], ch1], P('Case', 'top', 0.5)], '1', '1', { color: C.red });
  rel([P('Campaign', 'top', 0.7), [P('Campaign', 'top', 0.7)[0], ch2], [P('Hospital', 'bottom', 0.15)[0], ch2], P('Hospital', 'bottom', 0.15)], 'N', '1');
  rel([P('Expenditure', 'top', 0.85), P('Hospital', 'bottom', 0.05)], 'N', '1');
  rel([P('Expenditure', 'top', 0.4), P('Document', 'bottom', 0.4)], 'N', '1');
  rel([P('Expenditure', 'bottom', 0.95), P('Beneficiary', 'top', 0.1)], 'N', '1');
  rel([P('Case', 'top', 0.1), P('Document', 'bottom', 0.95)], '1', 'N');
  rel([P('Case', 'top', 0.8), P('Hospital', 'bottom', 0.8)], 'N', '1');
  rel([P('Case', 'bottom', 0.5), P('Beneficiary', 'top', 0.5)], 'N', '1');
  rel([P('Beneficiary', 'right', 0.2), P('BeneficiaryNote', 'bottom', 0.3)], '1', 'N');
  rel([P('Beneficiary', 'right', 0.6), P('ImportJob', 'left', 0.5)], 'N', '1');
  rel([P('Beneficiary', 'left', 0.4), P('CampaignBeneficiary', 'right', 0.5)], '1', 'N');
  rel([P('Pledge', 'left', 0.4), P('CollectionPoint', 'right', 0.5)], 'N', '1');
  rel([P('Pledge', 'bottom', 0.5), P('Receipt', 'top', 0.5)], '1', 'N');
  rel([P('Pledge', 'bottom', 0.9), P('Verification', 'top', 0.2)], '1', 'N');
  rel([P('Receipt', 'right', 0.5), P('Verification', 'left', 0.5)], '1', 'N');
  // logical link by the PaymentMethod enum value (no FK)
  rel([P('CampaignPaymentAccount', 'left', 0.5), [8, P('CampaignPaymentAccount', 'left', 0.5)[1]], [8, P('PaymentMethodConfig', 'left', 0.5)[1]], P('PaymentMethodConfig', 'left', 0.5)], '', '', { dash: '5 4', label: ['same method (enum, no FK)', 'نفس طريقة الدفع'] });

  for (const r of rels) {
    b += arrow(r.pts, { color: r.o.color || C.green, marker: false, dash: r.o.dash, sw: 1.5 });
    const card = (p, q, s) => {
      if (!s) return '';
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(16, len / 3);
      const x = p[0] + (dx / len) * k + (Math.abs(dy) > Math.abs(dx) ? 9 : 0);
      const yy = p[1] + (dy / len) * k + (Math.abs(dy) > Math.abs(dx) ? 0 : -6);
      return `<text x="${x}" y="${yy + 4}" font-size="13" font-weight="700" fill="${r.o.color || C.green}" text-anchor="middle">${s}</text>`;
    };
    b += card(r.pts[0], r.pts[1], r.a);
    b += card(r.pts[r.pts.length - 1], r.pts[r.pts.length - 2], r.z);
    if (r.o.label) b += tag(96, (r.pts[1][1] + r.pts[2][1]) / 2, r.o.label, { size: 10.5, w: 150 });
  }

  for (const [n, p] of Object.entries(pos)) {
    const [ar, fields] = ENT[n];
    const userHub = n === 'User';
    b += rect(p.x, p.y, p.w, p.h, { fill: C.white, stroke: userHub ? C.blue : C.green, sw: 1.6, rx: 8 });
    b += `<path d="M${p.x},${p.y + 8} a8,8 0 0 1 8,-8 h${p.w - 16} a8,8 0 0 1 8,8 v${HEAD - 8} h-${p.w} z" fill="${userHub ? C.blueBg : C.greenBg}"/>`;
    b += text(p.x + 12, p.y + 20, n, { size: 15, weight: 700, anchor: 'start', fill: userHub ? C.blue : C.greenDark });
    b += text(p.x + p.w - 12, p.y + 38, ar, { size: 12, anchor: 'end', dir: 'ltr', fill: C.muted });
    fields.forEach((f, i) => {
      const yy = p.y + HEAD + 16 + i * LH;
      const m = /^(PK|FK|UQ)\s(.*)$/.exec(f);
      if (m) {
        const col = m[1] === 'PK' ? C.give : m[1] === 'FK' ? C.blue : C.green;
        b += `<text x="${p.x + 12}" y="${yy}" font-size="11" font-weight="700" fill="${col}">${m[1]}</text>`;
        b += text(p.x + 40, yy, m[2], { size: 12, anchor: 'start', dir: 'ltr' });
      } else b += text(p.x + 40, yy, f, { size: 12, anchor: 'start', dir: 'ltr', fill: C.muted });
    });
  }
  // legend
  const lx = 20;
  const ly = pos.AuditLog.y;
  b += rect(lx, ly, 1070, 150, { fill: C.greyBg });
  b += text(lx + 16, ly + 26, 'Legend · مفتاح', { size: 14, weight: 700, anchor: 'start' });
  b += `<text x="${lx + 16}" y="${ly + 52}" font-size="12" font-weight="700" fill="${C.give}">PK</text>` + text(lx + 46, ly + 52, 'primary key (UUID) · المفتاح الأساسي', { size: 12, anchor: 'start', dir: 'ltr' });
  b += `<text x="${lx + 16}" y="${ly + 74}" font-size="12" font-weight="700" fill="${C.blue}">FK</text>` + text(lx + 46, ly + 74, 'foreign key → target model (explicit onDelete in the schema) · مفتاح أجنبي', { size: 12, anchor: 'start', dir: 'ltr' });
  b += `<text x="${lx + 16}" y="${ly + 96}" font-size="12" font-weight="700" fill="${C.green}">UQ</text>` + text(lx + 46, ly + 96, 'unique (single or composite) · قيد فريد', { size: 12, anchor: 'start', dir: 'ltr' });
  b += text(lx + 16, ly + 120, 'Relations to User (16 FKs: donor, recordedBy, reviewer, author, actor, …) are listed inside each box as "→ User" instead of drawn, to keep the diagram readable.', { size: 12, anchor: 'start', fill: C.muted });
  b += text(lx + 1054, ly + 140, 'العلاقات مع User مكتوبة داخل كل كيان (→ User) بدل رسمها. الخط الأحمر = علاقة 1:1 بين الحملة والحالة الطبية.', { size: 12, anchor: 'end', dir: 'rtl', fill: C.muted });
  return svg(W, H, b, 'ERD');
};

// ───────────────────────── 3. Use cases ─────────────────────────
diagrams['use-cases'] = () => {
  const W = 1560;
  const H = 1010;
  let b = '';
  b += text(W / 2, 40, 'Use case diagram · مخطط حالات الاستخدام', { size: 24, weight: 700, fill: C.greenDark });
  b += rect(300, 70, 960, 910, { fill: C.greyBg, stroke: C.green, sw: 1.8, rx: 16 });
  b += text(780, 98, 'Majlis Fund platform · منصة مجلس فند', { size: 16, weight: 700, fill: C.green });

  const actor = (x, y, en, ar, color) => {
    let s = `<g stroke="${color}" stroke-width="2.2" fill="none"><circle cx="${x}" cy="${y - 34}" r="13"/><path d="M${x},${y - 21} v34 M${x - 22},${y - 8} h44 M${x},${y + 13} l-18,26 M${x},${y + 13} l18,26"/></g>`;
    s += text(x, y + 62, en, { size: 14, weight: 700, fill: color });
    s += text(x, y + 81, ar, { size: 13, fill: color });
    return s;
  };
  const uc = (cx, cy, en, ar) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="200" ry="32" fill="${C.white}" stroke="${C.green}" stroke-width="1.5"/>` +
    lines(cx, cy, [en, ar], { size: 12.5, lh: 16 });
  const L = 560;
  const R = 1000;
  const cases = {
    browse: [L, 150, 'Browse campaigns & transparency', 'تصفح الحملات ولوحة الشفافية'],
    donate: [L, 225, 'Donate: transfer + receipt · e-wallet (Demo) · cash', 'التبرع: حوالة وإيصال · محفظة (تجريبي) · نقداً'],
    notify: [L, 300, 'Get instant notification & official receipt (QR)', 'إشعار فوري وإيصال رسمي مع QR'],
    mine: [L, 375, 'Track my donations', 'متابعة تبرعاتي'],
    cash: [L, 500, 'Confirm cash received at my collection point', 'تأكيد استلام النقد في نقطتي'],
    clear: [L, 575, 'View clearance history', 'سجل براءة الذمة'],
    intake: [L, 760, 'Register a medical case (intake)', 'تسجيل حالة طبية'],
    desk: [L, 835, 'Record a donation at the council desk', 'تسجيل تبرع حضوري في المجلس'],
    review: [R, 165, 'Review case: priority, hospital, amount', 'تدقيق الحالة: الأولوية والمشفى والمبلغ'],
    publish: [R, 240, 'Publish the medical campaign (anonymised)', 'نشر الحملة الطبية بلا هوية'],
    verify: [R, 420, 'Verify or reject a donation', 'اعتماد أو رفض التبرع'],
    spend: [R, 495, 'Record spending with public-safe proof', 'تسجيل الصرف مع إثبات عام'],
    monthly: [R, 570, 'Monthly sponsorship payments', 'دفعات الكفالة الشهرية'],
    setup: [R, 720, 'Manage categories & create campaigns', 'إدارة الفئات وإنشاء الحملات'],
    admin: [R, 795, 'Manage users, collection points, hospitals, accounts', 'إدارة المستخدمين والنقاط والمشافي والحسابات'],
    import: [R, 870, 'Import beneficiaries (anonymised codes)', 'استيراد المستفيدين برموز مجهولة'],
    audit: [R, 945, 'Campaign lifecycle & audit log', 'دورة حياة الحملة وسجل التدقيق'],
  };
  const actors = [
    [140, 230, 'Donor', 'المتبرع', C.give, ['browse', 'donate', 'notify', 'mine'], 'L'],
    [140, 520, 'Mukhi (collector)', '«مكي»', C.amber, ['cash', 'clear'], 'L'],
    [140, 790, 'Staff (intake)', 'موظف الاستقبال', C.blue, ['intake', 'desk'], 'L'],
    [1420, 190, 'Case officer', 'مدقق الحالات', C.blue, ['review', 'publish'], 'R'],
    [1420, 480, 'Finance verifier', 'المدقق المالي', C.green, ['verify', 'spend', 'monthly'], 'R'],
    [1420, 820, 'Admin', 'مدير النظام', C.red, ['setup', 'admin', 'import', 'audit', 'publish'], 'R'],
  ];
  for (const [x, y, , , color, list, side] of actors) {
    for (const k of list) {
      const [cx, cy] = cases[k];
      const ex = side === 'L' ? cx - 200 : cx + 200;
      b += arrow([[side === 'L' ? x + 26 : x - 26, y - 10], [ex, cy]], { color, marker: false, sw: 1.3 });
    }
  }
  // include / extend
  b += arrow([[cases.verify[0] - 120, cases.verify[1] - 27], [cases.notify[0] + 200, cases.notify[1] + 4]], { color: C.muted, dash: '6 4' });
  b += tag(860, 352, ['«include»', 'يتضمن'], { size: 11 });
  b += arrow([[cases.cash[0] + 200, cases.cash[1] - 6], [cases.verify[0] - 196, cases.verify[1] + 8]], { color: C.muted, dash: '6 4' });
  b += tag(785, 470, ['then verified', 'ثم يُعتمد'], { size: 11 });
  for (const k of Object.keys(cases)) b += uc(...cases[k]);
  for (const a of actors) b += actor(a[0], a[1], a[2], a[3], a[4]);
  return svg(W, H, b, 'Use cases');
};

// ───────────────────────── 4. Donation sequence ─────────────────────────
diagrams['donation-sequence'] = () => {
  const parts = [
    ['Donor', 'المتبرع', C.give],
    ['Web (Next.js) / Expo app', 'الويب / التطبيق', C.blue],
    ['NestJS API', 'الـAPI', C.green],
    ['File storage', 'تخزين الملفات', C.amber],
    ['PostgreSQL', 'قاعدة البيانات', C.amber],
    ['Notifications + outbox', 'الإشعارات وواتساب', C.grey],
    ['Finance verifier', 'المدقق المالي', C.green],
  ];
  const X = parts.map((_, i) => 110 + i * 232);
  const W = 1640;
  const msgs = [
    [0, 1, 'Choose campaign, amount, transfer method', 'اختيار الحملة والمبلغ وطريقة التحويل'],
    [1, 2, 'POST /pledges  (Bearer JWT, CreatePledgeDto)', 'إنشاء تعهد'],
    [2, 4, 'Pledge PLEDGED + referenceNo P-XXXXXX', 'حفظ التعهد'],
    [2, 5, 'In-app notification + WhatsApp outbox message', 'إشعار فوري بالاستلام'],
    [2, 1, '{ pledge, instructions }: fake receiving account + reference', 'رقم المرجع وحساب الاستلام (تجريبي)', true],
    ['note', 0, 'Donor transfers outside the platform (bank / e-wallet)', 'التحويل يتم خارج المنصة'],
    [0, 1, 'Upload the transfer receipt photo', 'رفع صورة الإيصال'],
    [1, 2, 'POST /pledges/:id/receipts  (multipart)', 'رفع الإيصال'],
    [2, 3, 'Check magic bytes · strip EXIF · sha256 · store', 'فحص الملف وحذف بيانات الموقع'],
    [2, 4, 'Receipt + Verification PENDING · Pledge RECEIPT_UPLOADED', 'قيد التحقق'],
    [2, 5, '«Received, pending verification»', 'استلمنا إيصالك وهو قيد التحقق'],
    [6, 2, 'GET /verifications  (queue, oldest first)', 'قائمة التحقق'],
    [6, 2, 'POST /verifications/:id/approve  (not their own entry)', 'اعتماد التبرع'],
    [2, 4, '$transaction: APPROVED · Pledge VERIFIED + R-YYYY-NNNNNN · verifiedAmount += amount · AuditLog', 'معاملة واحدة: اعتماد ورقم إيصال رسمي وزيادة الرصيد المحقق'],
    [2, 5, 'Official receipt notification + wa.me link', 'إشعار الإيصال الرسمي'],
    [0, 1, 'Open the official receipt', 'فتح الإيصال الرسمي'],
    [1, 2, 'GET /official-receipts/:no  (public)', 'جلب الإيصال برقمه'],
    [2, 1, 'Receipt data + QR (SVG) → public /receipts/:no', 'إيصال مع رمز QR للتحقق', true],
    [1, 0, 'Printable receipt; anyone can verify it by QR', 'إيصال قابل للطباعة والتحقق', true],
  ];
  const top = 150;
  const step = 54;
  const H = top + msgs.length * step + 120;
  let b = '';
  b += text(W / 2, 40, 'Donation sequence: transfer → verification → official receipt + QR', { size: 22, weight: 700, fill: C.greenDark });
  b += text(W / 2, 68, 'تسلسل التبرع: حوالة ← تحقق مالي ← إيصال رسمي مع QR', { size: 18, weight: 600, fill: C.greenDark });
  parts.forEach(([en, ar, color], i) => {
    b += arrow([[X[i], 128], [X[i], H - 40]], { color: C.border, marker: false, dash: '4 5' });
    b += box(X[i] - 100, 86, 200, 46, [en, ar], { fill: C.white, stroke: color, sw: 1.8, text: { size: 12.5, weight: 600 } });
  });
  msgs.forEach((m, i) => {
    const y = top + i * step + 20;
    if (m[0] === 'note') {
      b += box(X[m[1]] - 95, y - 22, 300, 44, [m[2], m[3]], { fill: C.amberBg, stroke: C.amber, rx: 6, text: { size: 11.5 } });
      return;
    }
    const [f, t, en, ar, ret] = m;
    const x1 = X[f];
    const x2 = X[t];
    const color = ret ? C.muted : f === 6 ? C.green : C.ink;
    b += arrow([[x1, y], [x2 + (x2 > x1 ? -4 : 4), y]], { color, dash: ret ? '6 4' : undefined, sw: 1.6 });
    const mid = (x1 + x2) / 2;
    b += text(mid, y - 20, en, { size: 12, weight: 600, fill: color === C.muted ? C.muted : C.ink });
    b += text(mid, y - 5, ar, { size: 11.5, fill: C.muted });
    b += `<circle cx="${Math.min(x1, x2) + 14}" cy="${y - 33}" r="0"/>`;
    b += text(Math.min(x1, x2) - 22, y + 4, String(i + 1 - (i > 5 ? 1 : 0)), { size: 11, weight: 700, fill: C.green });
  });
  const ny = H - 70;
  b += rect(40, ny, W - 80, 48, { fill: C.greyBg });
  b += text(60, ny + 20, 'Rules: a verifier never verifies their own entry · simulated (Demo) payments never reach verifiedAmount · collectors confirm cash but never verify.', { size: 12, anchor: 'start', fill: C.muted });
  b += text(W - 60, ny + 39, 'القواعد: لا يعتمد المدقق إدخاله · المدفوعات التجريبية لا تدخل الرصيد المحقق · المكي يؤكد الاستلام ولا يعتمد.', { size: 12, anchor: 'end', dir: 'rtl', fill: C.muted });
  return svg(W, H, b, 'Donation sequence');
};

// ───────────────────────── 5. Donation state machine ─────────────────────────
diagrams['donation-states'] = () => {
  const W = 1460;
  const H = 820;
  let b = '';
  b += text(W / 2, 40, 'Donation (Pledge) state machine · حالات التبرع', { size: 24, weight: 700, fill: C.greenDark });
  b += text(W / 2, 64, 'PledgeStatus in schema.prisma; transitions from pledges.service.ts, collector.service.ts, verifications.service.ts', { size: 13, fill: C.muted });
  const S = {
    PLEDGED: [300, 330, 'تعهد مسجل', C.blue],
    DEMO_CONFIRMED: [300, 140, 'دفع تجريبي مؤكد', C.grey],
    CANCELLED: [300, 600, 'ملغى', C.grey],
    RECEIPT_UPLOADED: [760, 220, 'إيصال مرفوع — قيد التحقق', C.amber],
    COLLECTED: [760, 470, 'استلمه المكي — قيد التحقق', C.amber],
    VERIFIED: [1220, 220, 'معتمد + إيصال رسمي', C.green],
    REJECTED: [1220, 560, 'مرفوض (مع السبب)', C.red],
  };
  const w = 240;
  const h = 64;
  const edge = (n, side) => {
    const [x, y] = S[n];
    return { top: [x, y - h / 2], bottom: [x, y + h / 2], left: [x - w / 2, y], right: [x + w / 2, y] }[side];
  };
  const tr = (pts, en, ar, lx, ly, color = C.muted) => {
    b += arrow(pts, { color, markerId: color === C.green ? 'arrowGreen' : color === C.red ? 'arrowRed' : 'arrow' });
    b += tag(lx, ly, [en, ar], { size: 11 });
  };
  // start
  b += `<circle cx="70" cy="330" r="12" fill="${C.ink}"/>`;
  tr([[82, 330], edge('PLEDGED', 'left')], 'POST /pledges · /pledges/cash', 'تعهد حوالة أو نقد', 130, 300);
  tr([[78, 320], [150, 140], edge('DEMO_CONFIRMED', 'left')], 'POST /pledges/demo (isDemo)', 'دفع تجريبي «Demo»', 110, 200);
  tr([[70, 342], [70, 492], [edge('COLLECTED', 'left')[0], 492]], 'POST /pledges/council · /pledges/collector', 'إدخال في المجلس أو من المكي', 470, 512);
  tr([edge('PLEDGED', 'right'), [560, 330], [560, 230], edge('RECEIPT_UPLOADED', 'left')], 'receipt upload → Verification PENDING', 'رفع الإيصال', 560, 280);
  tr([[edge('PLEDGED', 'bottom')[0] + 60, 362], [360, 440], edge('COLLECTED', 'left')], 'Mukhi confirms cash (cash only)', 'المكي يؤكد الاستلام', 470, 420);
  tr([edge('PLEDGED', 'bottom'), edge('CANCELLED', 'top')], 'donor cancels', 'إلغاء من المتبرع', 300, 555);
  tr([edge('RECEIPT_UPLOADED', 'right'), edge('VERIFIED', 'left')], 'finance approves → R-YYYY-NNNNNN + QR', 'اعتماد: إيصال رسمي ورصيد محقق', 990, 190, C.green);
  tr([edge('COLLECTED', 'right'), [1100, 400], [1160, edge('VERIFIED', 'bottom')[1]]], 'finance approves', 'اعتماد مالي', 1080, 360, C.green);
  tr([[edge('RECEIPT_UPLOADED', 'bottom')[0] + 80, 252], [1120, 528]], 'finance rejects (reason)', 'رفض مع السبب', 1000, 330, C.red);
  tr([edge('COLLECTED', 'right'), [1100, 470], [1100, 545], [edge('REJECTED', 'left')[0], 545]], 'finance rejects', 'رفض', 1010, 520, C.red);
  tr([[1300, 528], [1300, 340], [1300, 320], [edge('RECEIPT_UPLOADED', 'bottom')[0] + 110, 320], [edge('RECEIPT_UPLOADED', 'bottom')[0] + 110, 252]], 'donor uploads a new receipt', 'إيصال جديد', 1330, 420);
  tr([edge('REJECTED', 'bottom'), [1220, 720], [300, 720], edge('CANCELLED', 'bottom')], 'donor cancels', 'إلغاء', 760, 720);
  for (const [n, [x, y, ar, color]] of Object.entries(S)) {
    b += box(x - w / 2, y - h / 2, w, h, [n, ar], { fill: C.white, stroke: color, sw: 2, rx: 30, text: { size: 13, weight: 600 } });
  }
  const end = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${C.ink}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="7" fill="${C.ink}"/>`;
  b += arrow([edge('VERIFIED', 'right'), [1395, 220]], {});
  b += end(1410, 220);
  b += arrow([edge('DEMO_CONFIRMED', 'right'), [455, 140]], {});
  b += end(470, 140);
  b += arrow([edge('CANCELLED', 'left'), [145, 600]], {});
  b += end(130, 600);
  b += rect(40, 760, W - 80, 44, { fill: C.greyBg });
  b += text(60, 778, 'Only VERIFIED adds to Campaign.verifiedAmount (and may set the campaign FUNDED). DEMO_CONFIRMED is shown separately. COLLECTED = «received, pending verification».', { size: 12, anchor: 'start', fill: C.muted });
  b += text(W - 60, 796, 'فقط VERIFIED يزيد الرصيد المحقق؛ التجريبي يظهر منفصلاً؛ COLLECTED = «استُلم، بانتظار التحقق».', { size: 12, anchor: 'end', dir: 'rtl', fill: C.muted });
  return svg(W, H, b, 'Donation states');
};

// ───────────────────────── 6. System map: backend map ─────────────────────────
diagrams['map-backend'] = () => {
  const W = 1600;
  const H = 960;
  let b = '';
  b += text(W / 2, 40, 'Backend map — every module is built the same way · خريطة الخلفية', { size: 23, weight: 700, fill: C.greenDark });
  const cards = [
    ['Controller', 'المتحكم', 'where HTTP enters the feature', 'هنا يدخل طلب HTTP', 'PledgesController @Post(\'pledges\')', 'ParseUUIDPipe · @ApiTags · @CurrentUser()'],
    ['DTO', 'كائن نقل البيانات', 'checks what came in', 'يفحص ما وصل', 'CreatePledgeDto (class-validator)', 'ValidationPipe whitelist + forbidNonWhitelisted'],
    ['Service', 'الخدمة', 'decides what should happen', 'يقرر ماذا يحدث', 'PledgesService.create()', 'rules · $transaction · AuditService.log'],
    ['Guard', 'الحارس', 'may the user continue?', 'هل يُسمح بالمتابعة؟', 'JwtAuthGuard (passport-jwt)', 'roles: RoleAccessService.requireRole → 403'],
    ['Persistence', 'التخزين', 'stores / retrieves the data', 'يحفظ ويسترجع', 'PrismaService → PostgreSQL', '21 models · uuid · Decimal(14,2)'],
  ];
  const cw = 280;
  cards.forEach((c, i) => {
    const x = 30 + i * 312;
    const color = [C.blue, C.amber, C.green, C.red, C.greenDark][i];
    b += rect(x, 80, cw, 250, { fill: C.white, stroke: color, sw: 2 });
    b += `<rect x="${x}" y="80" width="${cw}" height="54" rx="10" fill="${color}"/>`;
    b += text(x + cw / 2, 104, c[0], { size: 18, weight: 700, fill: C.white });
    b += text(x + cw / 2, 125, c[1], { size: 13, fill: C.white });
    b += text(x + cw / 2, 165, c[2], { size: 13.5, weight: 600 });
    b += text(x + cw / 2, 186, c[3], { size: 13, fill: C.muted });
    b += `<line x1="${x + 20}" y1="205" x2="${x + cw - 20}" y2="205" stroke="${C.border}"/>`;
    b += text(x + cw / 2, 232, 'in Majlis Fund:', { size: 11.5, fill: C.muted });
    b += text(x + cw / 2, 256, c[4], { size: 12, weight: 600, fill: color });
    b += text(x + cw / 2, 280, c[5], { size: 11, fill: C.muted });
    if (i < 4) b += arrow([[x + cw + 2, 205], [x + 310, 205]], { color: C.muted });
  });
  // runtime order
  b += text(30, 380, 'Runtime order of one request (NestJS lifecycle) · ترتيب التنفيذ الفعلي لطلب واحد', { size: 15, weight: 700, anchor: 'start' });
  const steps = [
    ['ThrottlerGuard', 'تحديد المعدل'],
    ['JwtAuthGuard', 'التحقق من التوكن'],
    ['ValidationPipe (DTO)', 'فحص المدخلات'],
    ['Controller handler', 'المتحكم'],
    ['Service + requireRole', 'القواعد والأدوار'],
    ['Prisma $transaction', 'قاعدة البيانات'],
    ['AllExceptionsFilter', 'شكل خطأ موحد'],
  ];
  steps.forEach((s, i) => {
    const x = 30 + i * 222;
    b += box(x, 400, 200, 58, s, { fill: i === 6 ? C.redBg : C.greyBg, text: { size: 12.5 } });
    if (i < 6) b += arrow([[x + 200, 429], [x + 222, 429]], {});
  });
  b += text(30, 488, 'The guard runs before the DTO pipe at run time; the five pieces above are the roles, not the call order. Errors: { statusCode, message, error, path, timestamp }.', { size: 12, anchor: 'start', fill: C.muted });
  // modules
  b += text(30, 540, 'The 20 modules in api/src, by domain · الوحدات حسب المجال', { size: 15, weight: 700, anchor: 'start' });
  const groups = [
    ['Identity · الهوية', ['auth', 'users'], C.blue],
    ['Campaigns · الحملات', ['categories', 'campaigns', 'payment-methods', 'beneficiaries', 'cases', 'hospitals (lookups)', 'collection-points'], C.green],
    ['Money · الأموال', ['pledges', 'collector', 'verifications', 'expenditures'], C.give],
    ['Trust · الثقة', ['stats (transparency)', 'notifications + outbox', 'audit'], C.amber],
    ['Infrastructure · البنية', ['prisma', 'storage', 'imports', 'common (access, filters, shared)'], C.grey],
  ];
  groups.forEach(([title, mods, color], i) => {
    const x = 30 + i * 312;
    b += rect(x, 560, 290, 370, { fill: C.white, stroke: color, sw: 1.8 });
    b += text(x + 145, 588, title, { size: 14, weight: 700, fill: color });
    mods.forEach((m, j) => {
      b += box(x + 20, 606 + j * 44, 250, 36, [m], { fill: C.greyBg, stroke: C.border, rx: 6, text: { size: 12.5 } });
    });
  });
  return svg(W, H, b, 'Backend map');
};

// ───────────────────────── 7. System map: frontend map ─────────────────────────
diagrams['map-frontend'] = () => {
  const W = 1600;
  const H = 770;
  let b = '';
  b += text(W / 2, 40, 'Frontend map — Next.js 15 App Router (web/src) · خريطة الواجهة', { size: 23, weight: 700, fill: C.greenDark });
  const col = (x, title, sub, color, items, y0 = 80, w = 360) => {
    const h = 74 + items.length * 34;
    b += rect(x, y0, w, h, { fill: C.white, stroke: color, sw: 1.8 });
    b += `<rect x="${x}" y="${y0}" width="${w}" height="54" rx="10" fill="${color}"/>`;
    b += text(x + w / 2, y0 + 24, title, { size: 15, weight: 700, fill: C.white });
    b += text(x + w / 2, y0 + 44, sub, { size: 12, fill: C.white });
    items.forEach((it, i) => {
      const [p, d] = it;
      b += text(x + 16, y0 + 80 + i * 34, p, { size: 12.5, weight: 600, anchor: 'start', dir: 'ltr', family: 'Consolas, monospace' });
      b += text(x + w - 14, y0 + 80 + i * 34, d, { size: 11.5, anchor: 'end', dir: 'ltr', fill: C.muted });
    });
    return h;
  };
  col(30, 'app/(public) — no login', 'صفحات عامة', C.give, [
    ['/', 'campaigns by category'],
    ['/campaigns/[slug]', 'campaign + account'],
    ['/campaigns/[slug]/donate', 'every donation path'],
    ['/receipts/[no]', 'official receipt + QR'],
    ['/track', 'case tracking'],
    ['/transparency', 'dashboard + CSV'],
  ]);
  col(30, 'app/(auth)', 'الدخول', C.blue, [['/login', 'phone + password · Google']], 400);
  col(410, 'app/(app)/dashboard — session required', 'مساحة العمل (يتطلب جلسة)', C.green, [
    ['intake', 'STAFF · new case'],
    ['cases · cases/[id]', 'CASE_OFFICER review'],
    ['finance', 'FINANCE_VERIFIER queue'],
    ['spending · spending/[id]', 'expenditures'],
    ['donations', 'my donations'],
    ['collector', 'Mukhi PWA (mobile-first)'],
    ['outbox', 'wa.me messages'],
    ['notifications · profile', 'all roles'],
    ['imports', 'beneficiary import'],
    ['admin/campaigns (+new, [id])', 'ADMIN'],
    ['admin/categories · users', 'ADMIN'],
    ['admin/collection-points', 'ADMIN'],
    ['admin/hospitals · payment-methods', 'ADMIN'],
    ['admin/beneficiaries', 'ADMIN registry'],
  ], 80, 420);
  col(860, 'app/ route handlers & support', 'مسارات الخادم', C.grey, [
    ['api/campaigns/[id]/ledger', 'live progress'],
    ['api/files · api/proofs', 'file proxy'],
    ['api/transparency-csv', 'CSV proxy'],
    ['auth/google/start|callback', 'optional OAuth'],
    ['lang/route.ts', 'locale cookie'],
    ['manifest.ts · pwa-icons', 'installable PWA'],
  ]);
  col(860, 'src/ building blocks', 'مكونات البناء', C.blue, [
    ['lib/api/* (23, server-only)', 'apiFetch per resource'],
    ['lib/actions/* (17)', 'Server Actions'],
    ['lib/session', 'HttpOnly cookie 8h'],
    ['store/ (Redux)', 'currentUser only'],
    ['context/', 'Theme · Toast'],
    ['components/ui · i18n (next-intl)', 'tokens · ar/en RTL'],
  ], 400);
  // flow
  const fx = 1250;
  b += rect(fx, 80, 320, 600, { fill: C.greyBg, stroke: C.border });
  b += text(fx + 160, 108, 'Data flow · مسار البيانات', { size: 15, weight: 700 });
  const flow = [
    ['Server Component page', 'قراءة عند العرض'],
    ['lib/api/<resource>.ts', 'دالة لكل مورد'],
    ['apiFetch + Bearer from cookie', 'من الخادم فقط'],
    ['NestJS API', 'الواجهة البرمجية'],
  ];
  flow.forEach((f, i) => {
    b += box(fx + 30, 130 + i * 70, 260, 50, f, { text: { size: 12 } });
    if (i < 3) b += arrow([[fx + 160, 180 + i * 70], [fx + 160, 200 + i * 70]], {});
  });
  const wf = [
    ['Client form → Server Action', 'نموذج ← Server Action'],
    ['validate → requireSessionToken', 'تحقق وجلسة'],
    ['api call → map ApiError', 'خطأ مفهوم'],
    ['safeRevalidate + Toast', 'تحديث وإشعار'],
  ];
  wf.forEach((f, i) => {
    b += box(fx + 30, 420 + i * 62, 260, 46, f, { fill: C.blueBg, stroke: C.blue, text: { size: 12 } });
    if (i < 3) b += arrow([[fx + 160, 466 + i * 62], [fx + 160, 482 + i * 62]], { color: C.blue, markerId: 'arrowBlue' });
  });
  b += text(W / 2, 745, 'Rules: no middleware · JWT never in client JS · Client Components never import lib/api · Arabic RTL first, English second · dark/light themes.', { size: 12.5, fill: C.muted });
  return svg(W, H, b, 'Frontend map');
};

// ───────────────────────── 8. System map: mobile map ─────────────────────────
diagrams['map-mobile'] = () => {
  const W = 1500;
  const H = 820;
  let b = '';
  b += text(W / 2, 40, 'Mobile map — Expo SDK 58 donor app (mobile/src) · خريطة تطبيق الموبايل', { size: 23, weight: 700, fill: C.greenDark });
  const screens = [
    ['index.tsx', 'Campaigns of every category', 'كل الحملات حسب الفئة'],
    ['campaign/[slug].tsx', 'Campaign, ledger, receiving accounts', 'الحملة والحساب'],
    ['pledge/[campaignId].tsx', 'Donate: e-wallet (Demo) · transfer + receipt · cash point', 'التبرع بكل الطرق'],
    ['receipt/[pledgeId].tsx', 'Acknowledgement / official receipt', 'الإيصال'],
    ['donations.tsx', 'My donations', 'تبرعاتي'],
    ['notifications.tsx', 'Notifications', 'الإشعارات'],
    ['transparency.tsx', 'Transparency dashboard', 'لوحة الشفافية'],
    ['login.tsx', 'Phone + password login', 'تسجيل الدخول'],
  ];
  b += rect(30, 80, 640, 90 + screens.length * 72, { fill: C.white, stroke: C.give, sw: 1.8 });
  b += text(350, 110, 'src/app — expo-router screens (_layout.tsx: fonts, RTL, auth)', { size: 15, weight: 700, fill: C.give });
  screens.forEach(([f, en, ar], i) => {
    const y = 130 + i * 72;
    b += rect(50, y, 600, 60, { fill: C.greyBg, rx: 8 });
    b += text(66, y + 24, f, { size: 13, weight: 700, anchor: 'start', family: 'Consolas, monospace' });
    b += text(66, y + 46, en, { size: 12, anchor: 'start', fill: C.muted });
    b += text(634, y + 34, ar, { size: 12.5, anchor: 'end', dir: 'ltr' });
  });
  const lib = [
    ['lib/api.ts', 'fetch + Authorization: Bearer; 401 → clear token → login'],
    ['lib/storage.ts', 'token in expo-secure-store'],
    ['lib/auth.tsx', 'session context'],
    ['lib/config.ts', 'EXPO_PUBLIC_API_URL · EXPO_PUBLIC_SITE_URL'],
    ['lib/funding.ts · receipt.ts · links.ts', 'progress, receipt links, share'],
    ['ui/ (theme, CampaignCover, CategoryIcon)', 'react-native-svg illustrations'],
    ['i18n/ (i18next)', 'Arabic RTL first, English'],
    ['shared/', 'enums copied from the API'],
  ];
  b += rect(720, 80, 750, 90 + lib.length * 52, { fill: C.white, stroke: C.blue, sw: 1.8 });
  b += text(1095, 110, 'Building blocks · مكونات البناء', { size: 15, weight: 700, fill: C.blue });
  lib.forEach(([f, d], i) => {
    const y = 130 + i * 52;
    b += text(740, y + 22, f, { size: 12.5, weight: 700, anchor: 'start', family: 'Consolas, monospace' });
    b += text(1450, y + 22, d, { size: 12, anchor: 'end', fill: C.muted });
    b += `<line x1="740" y1="${y + 36}" x2="1450" y2="${y + 36}" stroke="${C.border}"/>`;
  });
  b += box(860, 620, 470, 90, ['NestJS API (same endpoints as the web)', 'نفس الواجهة البرمجية — لا يمر عبر Next.js'], { fill: C.greenBg, stroke: C.green, text: { size: 13.5, weight: 600 } });
  b += arrow([[1095, 548], [1095, 620]], { color: C.green, markerId: 'arrowGreen' });
  b += arrow([[670, 300], [700, 300], [700, 665], [860, 665]], { color: C.green, markerId: 'arrowGreen' });
  b += tag(1170, 585, ['REST + JSON over Wi-Fi/LAN', 'Bearer JWT'], { size: 11 });
  b += text(W / 2, 790, 'Donor app only: browse, donate on every path, notifications, my donations. Staff and the Mukhi use the web (the Mukhi as an installable PWA).', { size: 12.5, fill: C.muted });
  return svg(W, H, b, 'Mobile map');
};

// ───────────────────────── 9. System map: data relationship map ─────────────────────────
diagrams['map-data'] = () => {
  const W = 1500;
  const H = 760;
  let b = '';
  b += text(W / 2, 40, 'Data relationship map (conceptual) · خريطة علاقات البيانات', { size: 23, weight: 700, fill: C.greenDark });
  const n = (x, y, en, ar, color = C.green, w = 210) => box(x, y, w, 64, [en, ar], { fill: C.white, stroke: color, sw: 2, text: { size: 13.5, weight: 600 } });
  b += n(40, 140, 'Campaign category', 'فئة الحملة');
  b += n(330, 140, 'Campaign', 'الحملة', C.greenDark);
  b += n(620, 140, 'Pledge (donation)', 'التبرع', C.give);
  b += n(910, 90, 'Receipt', 'إيصال التحويل', C.amber);
  b += n(910, 200, 'Verification', 'التحقق المالي', C.amber);
  b += n(1200, 140, 'Official receipt', 'الإيصال الرسمي R-…', C.green, 260);
  b += n(330, 330, 'Expenditure', 'الصرف', C.give);
  b += n(620, 330, 'Proof document', 'إثبات الصرف', C.amber);
  b += n(330, 500, 'Campaign ↔ beneficiary', 'ربط الحملة بالمستفيد');
  b += n(620, 500, 'Beneficiary B-XXXX', 'مستفيد برمز مجهول', C.blue);
  b += n(40, 330, 'Medical case', 'الحالة الطبية', C.red);
  b += n(40, 500, 'Hospital', 'المشفى', C.red);
  b += n(910, 330, 'Collection point', 'نقطة الجمع', C.amber);
  b += n(910, 500, 'User (role)', 'المستخدم ودوره', C.blue);
  const a = (pts, label) => {
    b += arrow(pts, { color: C.muted });
    if (label) b += tag((pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2 - 2, label, { size: 10.5 });
  };
  a([[250, 172], [330, 172]], ['groups', 'تضم']);
  a([[540, 172], [620, 172]], ['receives', 'تستقبل']);
  a([[830, 160], [910, 122]]);
  a([[830, 184], [910, 232]]);
  a([[1120, 232], [1200, 180]], ['approve', 'اعتماد']);
  a([[435, 204], [435, 330]], ['spends', 'تصرف']);
  a([[540, 362], [620, 362]], ['proof', 'إثبات']);
  a([[350, 204], [350, 250], [300, 250], [300, 532], [330, 532]]);
  a([[540, 532], [620, 532]]);
  a([[145, 330], [145, 236], [330, 190]], ['1:1 medical', 'طبية']);
  a([[145, 500], [145, 394]], ['approved payee', 'جهة الصرف']);
  b += arrow([[960, 330], [960, 290], [720, 290], [720, 204]], { color: C.muted });
  b += tag(860, 290, ['cash', 'نقداً'], { size: 10.5 });
  a([[1015, 500], [1015, 394]], ['Mukhi', 'المكي']);
  b += arrow([[1120, 532], [1170, 532], [1170, 310], [800, 310], [800, 204]], { color: C.muted });
  b += tag(1170, 430, ['donor', 'المتبرع'], { size: 10.5 });
  b += rect(40, 620, W - 80, 110, { fill: C.greyBg, stroke: C.border, dash: '6 4' });
  b += text(W / 2, 648, 'Cross-cutting — triggered by what happens elsewhere · عناصر عابرة', { size: 15, weight: 700 });
  b += box(120, 664, 380, 50, ['Notification · إشعار داخل التطبيق'], { text: { size: 13 } });
  b += box(560, 664, 380, 50, ['OutboundMessage · رسالة واتساب (wa.me)'], { text: { size: 13 } });
  b += box(1000, 664, 380, 50, ['AuditLog · سجل التدقيق لكل تعديل'], { text: { size: 13 } });
  return svg(W, H, b, 'Data relationship map');
};

// ───────────────────────── 10. System map: one donation through the stack ─────────────────────────
diagrams['map-donation-stack'] = () => {
  const W = 1560;
  const H = 1000;
  let b = '';
  b += text(W / 2, 40, 'One feature through the whole stack: a donation · ميزة واحدة عبر كل الطبقات: التبرع', { size: 22, weight: 700, fill: C.greenDark });
  const layers = [
    ['UI', 'الواجهة', 'web: app/(public)/campaigns/[slug]/donate/page.tsx · mobile: src/app/pledge/[campaignId].tsx', C.give],
    ['Write path', 'مسار الكتابة', 'web: lib/actions/donations.ts transferPledgeAction (validate → requireSessionToken) · mobile: lib/api.ts', C.blue],
    ['HTTP', 'الطلب', 'lib/api/pledges.ts → apiFetch → POST /pledges  { campaignId, amount, method }  Authorization: Bearer', C.blue],
    ['Guard', 'الحارس', 'JwtAuthGuard → JwtStrategy.validate() reloads id / role / isActive from the database', C.red],
    ['DTO', 'التحقق', 'CreatePledgeDto + ValidationPipe (whitelist, forbidNonWhitelisted, transform)', C.amber],
    ['Controller', 'المتحكم', 'PledgesController.create(@CurrentUser() user, @Body() dto)', C.green],
    ['Service', 'الخدمة', 'PledgesService.create: requireRole([DONOR]) · campaign accepts pledges · referenceNo · receiving accounts', C.green],
    ['Persistence', 'التخزين', 'prisma.$transaction → Pledge (PLEDGED) · Notification · OutboundMessage · AuditLog', C.greenDark],
    ['Response', 'الاستجابة', '{ pledge, instructions } → the page shows the reference and the (fake) receiving account', C.give],
  ];
  layers.forEach(([en, ar, d, color], i) => {
    const y = 80 + i * 78;
    b += `<rect x="40" y="${y}" width="190" height="62" rx="10" fill="${color}"/>`;
    b += text(135, y + 26, en, { size: 15, weight: 700, fill: C.white });
    b += text(135, y + 47, ar, { size: 12.5, fill: C.white });
    b += rect(240, y, 860, 62, { fill: C.white, stroke: color });
    b += text(256, y + 36, d, { size: 12.5, anchor: 'start', family: "Consolas, 'Segoe UI', monospace" });
    if (i < layers.length - 1) b += arrow([[135, y + 62], [135, y + 78]], {});
  });
  b += rect(1140, 80, 390, 686, { fill: C.greyBg, stroke: C.border });
  b += text(1335, 108, 'The rest of the journey · بقية الرحلة', { size: 15, weight: 700 });
  const rest = [
    ['POST /pledges/:id/receipts', 'receipt → Verification PENDING', 'رفع الإيصال'],
    ['GET /verifications', 'finance queue', 'قائمة التحقق'],
    ['POST /verifications/:id/approve', 'VERIFIED · R-YYYY-NNNNNN · verifiedAmount', 'اعتماد وإيصال رسمي'],
    ['GET /official-receipts/:no', 'receipt + QR (SVG)', 'الإيصال مع QR'],
    ['GET /stats/transparency', 'totals collected / spent / remaining', 'لوحة الشفافية'],
    ['POST /expenditures', 'spending with public-safe proof', 'الصرف مع إثبات'],
  ];
  rest.forEach(([ep, en, ar], i) => {
    const y = 130 + i * 104;
    b += rect(1160, y, 350, 86, { fill: C.white, rx: 8 });
    b += text(1176, y + 26, ep, { size: 12.5, weight: 700, anchor: 'start', family: 'Consolas, monospace', fill: C.green });
    b += text(1176, y + 50, en, { size: 12, anchor: 'start', fill: C.muted });
    b += text(1494, y + 74, ar, { size: 12.5, anchor: 'end', dir: 'ltr' });
    if (i < rest.length - 1) b += arrow([[1335, y + 86], [1335, y + 104]], {});
  });
  b += rect(40, 800, 1490, 170, { fill: C.greenBg, stroke: C.green });
  b += text(60, 830, 'Where the rules live · أين تعيش القواعد', { size: 15, weight: 700, anchor: 'start' });
  const rules = [
    'The backend decides: the page only collects input; the service checks the role, the campaign state and the amount.',
    'Money is counted once: only a finance approval (by someone else than the entry owner) adds to verifiedAmount; Demo money is kept apart.',
    'Every write is audited (AuditLog) and every donation path sends an instant in-app notification + a WhatsApp outbox message.',
    'الواجهة تجمع المدخلات فقط؛ الخدمة تقرر. الاعتماد المالي وحده يزيد الرصيد المحقق. كل تعديل مسجل، وكل تبرع يصله إشعار فوري.',
  ];
  rules.forEach((r, i) => (b += /^[؀-ۿ]/.test(r) ? text(1510, 860 + i * 26, r, { size: 12.5, anchor: 'end', dir: 'rtl' }) : text(60, 860 + i * 26, r, { size: 12.5, anchor: 'start', dir: 'ltr' })));
  return svg(W, H, b, 'One donation through the stack');
};

// ───────────────────────── write + render ─────────────────────────
async function main() {
  const names = Object.keys(diagrams);
  for (const n of names) fs.writeFileSync(path.join(outDir, `${n}.svg`), diagrams[n]());
  console.log(`SVG: ${names.map((n) => `${n}.svg`).join(', ')}`);
  if (process.argv.includes('--svg-only')) return;

  const pwArg = process.argv.indexOf('--playwright');
  const pwDir = pwArg > 0 ? process.argv[pwArg + 1] : path.join(root, 'e2e');
  const { chromium } = require(require.resolve('@playwright/test', { paths: [pwDir] }));
  const fontDir = path.join(root, 'mobile/node_modules/@expo-google-fonts/ibm-plex-sans-arabic');
  const face = (w, f) => {
    const p = path.join(fontDir, f);
    return fs.existsSync(p) ? `@font-face{font-family:'IBM Plex Sans Arabic';font-weight:${w};src:url('file:///${p.replace(/\\/g, '/')}')}` : '';
  };
  const css = face(400, '400Regular/IBMPlexSansArabic_400Regular.ttf') + face(600, '600SemiBold/IBMPlexSansArabic_600SemiBold.ttf') + face(700, '700Bold/IBMPlexSansArabic_700Bold.ttf');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const tmp = path.join(require('os').tmpdir(), 'majlis-diagram.html');
  for (const n of names) {
    const s = fs.readFileSync(path.join(outDir, `${n}.svg`), 'utf8');
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${css}html,body{margin:0;background:#fff}svg{display:block}</style></head><body>${s}</body></html>`);
    await page.goto(`file:///${tmp.replace(/\\/g, '/')}`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('svg').first().screenshot({ path: path.join(outDir, `${n}.png`) });
  }
  await browser.close();
  console.log(`PNG: ${names.length} files (2× scale) in ${path.relative(root, outDir)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
