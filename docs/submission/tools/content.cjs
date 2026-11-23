// Text of the four submission documents (Arabic + English, same information in both).
// TEAM_AR / TEAM_EN in the subtitles = the team label (build-docx.cjs --label-ar / --label-en).
// Members: roles and contributions from the team leader (2026-11-23); English names = GitHub display names, and
// usernames = collaborators of hamidAlhaj/salamiyah-hackathon (GitHub REST API, 2026-11-23).
'use strict';

const REPO = 'https://github.com/hamidAlhaj/salamiyah-hackathon';
// [Arabic name, English name, GitHub username, role AR, role EN, contribution AR, contribution EN]
const MEMBERS = [
  ['حميد الدين الحاج', 'Hamid Alhaj', 'hamidAlhaj', 'قائد الفريق، الموبايل والخلفية', 'Team Leader, Mobile & Backend',
    'قاد المشروع، وبنى خلفية NestJS وقاعدة البيانات وتطبيق React Native', 'Led the project; built the NestJS backend, the database and the React Native mobile app'],
  ['رامي الشعار', 'Rami Alshaar', 'RamiAlshaar', 'الخلفية والواجهة، مختبر الأمان', 'Backend & Frontend, Security Tester',
    'اختبار أمان الخلفية: فحص OWASP ZAP، وXSS، وحقن SQL/NoSQL، وتحديد المعدل، وفحوص المصادقة', 'Backend security testing: OWASP ZAP scan, XSS, SQL/NoSQL injection, rate limiting and auth checks'],
  ['بدر الجرف', 'Badr Aljerf', 'Badr-pixel-netizen', 'الواجهة والعرض التقديمي', 'Frontend, Presentation',
    'أعمال الواجهة والعرض التقديمي النهائي (PowerPoint)', 'Frontend work and the final presentation (PowerPoint)'],
  ['يوسف يوسف', 'Yousef Yousef', 'Yousef2001yousef', 'الواجهة', 'Frontend',
    'صفحات وواجهات Next.js', 'Next.js frontend pages and UI'],
  ['نوار حسن', 'Nawar Hasan', 'nawarhasan55', 'الموبايل', 'Mobile',
    'شاشات تطبيق React Native واختباره على الأجهزة', 'React Native mobile app screens and device testing'],
];

// ───────────────────────── Project brief (1 page) ─────────────────────────
const brief = {
  ar: {
    title: 'ملخص المشروع — مجلس فند (Majlis Fund)',
    sub: 'فريق: TEAM_AR · هاكاثون B4F · تشرين الثاني 2026',
    sections: [
      ['اسم المشروع ونبذة', [
        '<b>مجلس فند</b>: منصة ويب مبسطة مع تطبيق موبايل للمتبرعين، مخصصة للمجلس المحلي في مدينة سلمية لإدارة حملات التبرع المحلية وتوثيقها بشفافية.',
      ]],
      ['المشكلة وفكرة الحل', [
        '<b>المشكلة:</b> تُجمع التبرعات المحلية يدوياً (نقداً وحوالات) دون سجل موحد، فلا يعرف المتبرع هل وصل تبرعه، ولا يرى المجتمع أين صُرف المال، مما يُضعف الثقة.',
        '<b>الحل:</b> ينشئ المجلس حملات ضمن فئات (كفالة أيتام، ترميم منازل، مساعدات طبية…) بمبلغ مستهدف؛ يتبرع الناس بحوالة مع صورة الإيصال أو بمحفظة محلية أو نقداً عند «المكي» في نقطة جمع؛ يصل إشعار فوري بالاستلام، ثم إيصال رسمي مع QR بعد التحقق المالي؛ ولوحة شفافية عامة تعرض المجموع والمصروف والمستفيدين برموز مجهولة.',
      ]],
      ['الفئة المستهدفة وأهم الخصائص', [
        '<b>الفئة:</b> المجلس المحلي وموظفوه، المتبرعون داخل سلمية وخارجها، المكيّون في نقاط الجمع، والمجتمع المحلي.',
        '<b>الخصائص:</b> حملات حسب فئات قابلة للإضافة · ثلاثة طرق تبرع (حوالة وإيصال، محفظة إلكترونية تجريبية «Demo»، نقداً) · إشعار فوري ورسالة واتساب عبر رابط wa.me · تحقق مالي وإيصال رسمي R-YYYY-NNNNNN مع QR · تسجيل الصرف مع إثبات · لوحة شفافية · أدوار وصلاحيات · عربي RTL وإنجليزي.',
      ]],
      ['التقنيات المستخدمة', [
        'الخلفية: NestJS 10 مع Prisma 5 وPostgreSQL · الواجهة: Next.js 15 مع Tailwind · الموبايل: React Native عبر Expo SDK 58 · أدوات: Swagger وPostman وJest وVitest وPlaywright.',
      ]],
    ],
    teamTitle: 'أعضاء الفريق',
    teamHead: ['الاسم', 'الدور', 'المساهمة الرئيسية', 'GitHub'],
    links: [
      ['رابط المستودع', REPO],
      ['رابط العرض التجريبي', 'لا يوجد رابط عام؛ العرض حي على الشبكة المحلية (انظر ملف DEMO.md)'],
    ],
  },
  en: {
    title: 'Project Brief — Majlis Fund (مجلس فند)',
    sub: 'Team: TEAM_EN · B4F Hackathon · November 2026',
    sections: [
      ['Project name and summary', [
        '<b>Majlis Fund</b>: a simple web platform with a donor mobile app, dedicated to the Local Council of Salamiyah to manage and document local donation campaigns transparently.',
      ]],
      ['Problem and solution', [
        '<b>Problem:</b> local donations are collected by hand (cash and transfers) with no single record, so donors do not know whether their donation arrived and the community cannot see where the money went, which weakens trust.',
        '<b>Solution:</b> the council creates campaigns in categories (orphan sponsorship, home renovation, medical aid…) with a target amount; people give by transfer + receipt photo, local e-wallet, or cash handed to the «Mukhi» at a collection point; an instant notification confirms receipt, then an official receipt with QR after finance verification; a public transparency dashboard shows the total collected, the amounts spent and the beneficiaries by anonymous code.',
      ]],
      ['Target audience and main features', [
        '<b>Audience:</b> the Local Council and its staff, donors in Salamiyah and abroad, the Mukhis at collection points, and the local community.',
        '<b>Features:</b> campaigns by extensible category · three ways to give (transfer + receipt, simulated e-wallet «Demo», cash) · instant notification and WhatsApp message via a wa.me link · finance verification and official receipt R-YYYY-NNNNNN with QR · spending with proof · transparency dashboard · roles and permissions · Arabic RTL and English.',
      ]],
      ['Technologies', [
        'NestJS 10 + Prisma 5 + PostgreSQL (backend) · Next.js 15 + Tailwind (frontend) · React Native / Expo SDK 58 (mobile) · Swagger · Postman · Jest · Vitest · Playwright.',
      ]],
    ],
    teamTitle: 'Team members',
    teamHead: ['Name', 'Role', 'Main contribution', 'GitHub'],
    links: [
      ['Repository', REPO],
      ['Demo URL', 'No public URL; live demo on the local network (see DEMO.md)'],
    ],
  },
};

// ───────────────────────── Analysis & design (4–5 pages + diagrams) ─────────────────────────
const analysis = {
  ar: {
    title: 'الدراسة التحليلية والتصميمية — مجلس فند',
    sub: 'فريق: TEAM_AR · هاكاثون B4F · تشرين الثاني 2026 · المستودع: ' + REPO,
    blocks: [
      ['h', '1. نظرة عامة على النظام (System Overview)'],
      ['p', '<b>المشكلة:</b> تبرعات المجلس المحلي في سلمية تُجمع وتُصرف يدوياً بلا سجل موحد ولا إثبات منشور، فلا يتأكد المتبرع من وصول تبرعه ولا يرى المجتمع مصير المال.'],
      ['p', '<b>الهدف:</b> أتمتة دورة التبرع كاملة (حملة ← تبرع ← تحقق ← إيصال ← صرف ← شفافية) لتعزيز الثقة بين المجتمع والمجلس.'],
      ['p', '<b>الفئة المستهدفة:</b> المجلس وموظفوه، المتبرعون محلياً وفي المغترب، المكيّون في نقاط الجمع، والمجتمع.'],
      ['p', '<b>النطاق (Scope):</b> حملات ضمن فئات بيانات (طبية، كفالة أيتام، ترميم، وفئات يضيفها المدير) بمبلغ مستهدف؛ التبرع بحوالة وإيصال، بمحفظة إلكترونية محاكاة («Demo»)، أو نقداً عند المكي؛ إشعارات فورية؛ تحقق مالي وإيصال رسمي مع QR؛ تسجيل الصرف مع إثبات؛ لوحة شفافية؛ مستفيدون برموز مجهولة؛ إدارة المستخدمين والنقاط والمشافي والحسابات؛ تطبيق موبايل للمتبرع.'],
      ['p', '<b>خارج النطاق (Out of Scope):</b> بوابة دفع حقيقية، واجهة WhatsApp Business، السلال الغذائية والتعليم، الاعتماد المشترك، تحويلات الآغا خان، والمطابقة الشهرية. كل أرقام الحسابات والبيانات وهمية للعرض.'],
      ['h', '2. الأدوار (Actors / User Roles)'],
      ['table', ['الدور', 'ما يفعله في النظام'], [
        ['المتبرع (DONOR)', 'يتصفح الحملات، يتبرع بكل الطرق، يستلم الإشعارات والإيصال الرسمي، يتابع تبرعاته.'],
        ['«المكي» (COLLECTOR)', 'يؤكد استلام النقد في نقاط الجمع التابعة له فقط؛ لا يعتمد ولا يغير الأرصدة.'],
        ['موظف الاستقبال (STAFF)', 'يسجل الحالات الطبية والتبرعات الحضورية في المجلس.'],
        ['مدقق الحالات (CASE_OFFICER)', 'يدقق الحالة الطبية، يحدد الأولوية والمشفى والمبلغ، وينشر حملتها.'],
        ['المدقق المالي (FINANCE_VERIFIER)', 'يعتمد أو يرفض التبرعات، ويسجل الصرف مع الإثبات والدفعات الشهرية.'],
        ['مدير النظام (ADMIN)', 'يدير الفئات والحملات والمستخدمين ونقاط الجمع والمشافي وحسابات الاستلام والاستيراد وسجل التدقيق.'],
        ['الزائر العام', 'يرى الحملات ولوحة الشفافية ويتحقق من الإيصال برمز QR دون تسجيل دخول.'],
      ]],
      ['h', '3. المتطلبات الوظيفية (Functional Requirements)'],
      ['ul', [
        'FR1 تسجيل الدخول برقم الهاتف وكلمة المرور (وGoogle اختيارياً) وإنشاء حساب متبرع.',
        'FR2 إدارة فئات الحملات كبيانات مع خصائص سلوك (حالة طبية، مشفى مقفل، كفالة شهرية).',
        'FR3 إنشاء حملة بفئة ومبلغ مستهدف وملخص مجهول الهوية وصورة توضيحية، ونشرها وإيقافها وإغلاقها.',
        'FR4 عرض الحملات للعامة مع حساب الحملة: المحقق، قيد التحقق، التجريبي، المصروف، المتبقي.',
        'FR5 التبرع بحوالة: تعهد برقم مرجع وحساب استلام ثم رفع صورة الإيصال.',
        'FR6 الدفع الإلكتروني المحاكى (شام كاش، سيريتل كاش، MTN كاش، PayPal، Visa) بشارة «Demo» وبلا أثر على المبالغ المحققة.',
        'FR7 التبرع نقداً باختيار نقطة جمع، وتأكيد المكي للاستلام.',
        'FR8 إشعار فوري داخل التطبيق ورسالة واتساب في صندوق الصادر لكل تبرع.',
        'FR9 التحقق المالي (اعتماد/رفض بسبب) وإصدار إيصال رسمي R-YYYY-NNNNNN مع QR قابل للتحقق العام.',
        'FR10 تسجيل الصرف بنوع الجهة والمبلغ والتاريخ وإثبات آمن للنشر، والدفعات الشهرية للكفالة.',
        'FR11 لوحة شفافية عامة وتصدير CSV.',
        'FR12 مسار الحالات الطبية: استقبال ← تدقيق ← نشر حملة.',
        'FR13 ربط المستفيدين بالحملات برمز B-XXXX واستيرادهم من Excel/CSV.',
        'FR14 سجل تدقيق لكل تعديل وتنبيهات تجاوز مهلة التدقيق.',
      ]],
      ['h', '4. المتطلبات غير الوظيفية (Non-Functional Requirements)'],
      ['ul', [
        '<b>الأمن:</b> JWT لمدة 8 ساعات، كلمات مرور bcrypt، صلاحيات حسب الدور، تحقق من كل مدخل، تحديد معدل الدخول، فحص الملفات.',
        '<b>الخصوصية:</b> لا تظهر هوية أي مستفيد للعامة (رمز ونوع ومنطقة فقط)؛ الرقم الوطني مخزن كـ HMAC.',
        '<b>الأداء والشبكات الضعيفة:</b> صفحات تُعرض من الخادم، مخططات SVG خفيفة، بلا مكتبات ثقيلة أو وسائط تلقائية.',
        '<b>سهولة الاستخدام:</b> عربي RTL أولاً مع الإنجليزية، تباين WCAG-AA، تركيز مرئي، وضع داكن وفاتح.',
        '<b>الاعتمادية:</b> كل كتابة متعددة الصفوف في معاملة واحدة؛ الأموال التجريبية لا تختلط بالمحققة؛ سجل تدقيق.',
        '<b>الاستجابة:</b> واجهة تعمل على الهاتف، تطبيق المكي PWA قابل للتثبيت، وتطبيق Expo للمتبرع.',
        '<b>قابلية الصيانة:</b> وحدة لكل مجال، نسخ مثبتة، 392 اختبار وحدة في الخلفية و53 في الواجهة وسيناريو Playwright كامل.',
      ]],
      ['h', '5. حالات الاستخدام (Use Cases)'],
      ['uc', 'UC1 — التبرع بحوالة والحصول على إيصال رسمي', 'المتبرع، المدقق المالي', [
        'يختار المتبرع حملة ومبلغاً وطريقة «حوالة بنك بيمو».',
        'يُنشئ النظام تعهداً برقم مرجع ويعرض حساب الاستلام ويرسل إشعاراً فورياً.',
        'يحوّل المتبرع خارج المنصة ثم يرفع صورة الإيصال؛ يصبح التبرع «قيد التحقق».',
        'يعتمد المدقق المالي (ليس صاحب الإدخال)؛ يُصدر إيصال رسمي مع QR ويزيد المبلغ المحقق للحملة.',
      ]],
      ['uc', 'UC2 — التبرع نقداً عند المكي', 'المتبرع، المكي، المدقق المالي', [
        'يختار المتبرع «نقداً» ونقطة جمع فعالة، فيحصل على رقم مرجع.',
        'يسلّم المبلغ للمكي الذي يؤكد الاستلام بنقرة واحدة؛ يظهر المبلغ «مستلم، قيد التحقق».',
        'يعتمد المدقق المالي فيصدر الإيصال الرسمي؛ المكي لا يعتمد ولا يغير الأرصدة.',
      ]],
      ['uc', 'UC3 — تسجيل الصرف وعرض الشفافية', 'المدقق المالي، الزائر العام', [
        'يسجل المدقق صرفاً لحملة: الجهة والمبلغ (لا يتجاوز المحقق ناقص المصروف) والتاريخ وإثبات آمن للنشر.',
        'للحملة الطبية تكون الجهة المشفى المعتمد فقط.',
        'تعرض لوحة الشفافية المجموع والمصروف والمتبقي والمستفيدين برموز مجهولة؛ عند صرف كامل الهدف تصبح الحملة «تم الإنجاز».',
      ]],
      ['img', 'use-cases.png', 'مخطط حالات الاستخدام'],
      ['h', '6. مخطط المعمارية (Architecture Diagram)'],
      ['p', 'ثلاثة تطبيقات في مستودع واحد: خادم Next.js يعرض الصفحات ويتصل بالـAPI من الخادم فقط (التوكن في cookie محمي)، وتطبيق Expo يتصل بالـAPI مباشرة بتوكن في SecureStore، وواجهة NestJS تملك كل القواعد وتخزن في PostgreSQL عبر Prisma، مع تخزين ملفات محلي وروابط wa.me لواتساب دون أي API خارجي.'],
      ['img', 'architecture.png', 'مخطط المعمارية'],
      ['h', '7. تصميم قاعدة البيانات (ERD)'],
      ['p', '21 جدولاً بمفاتيح أساسية UUID ومفاتيح أجنبية صريحة. أهم العلاقات: CampaignCategory 1—N Campaign؛ Campaign 1—N Pledge؛ Pledge 1—N Receipt وVerification؛ Campaign 1—N Expenditure (FK proofDocumentId → Document)؛ Campaign N—N Beneficiary عبر CampaignBeneficiary؛ Case 1—1 Campaign؛ Hospital 1—N Case. كل جدول يشير إلى User عبر FK للمنشئ أو المراجع.'],
      ['img', 'erd.png', 'مخطط الكيانات والعلاقات مع المفاتيح'],
      ['h', '8. الأمن والمصادقة (Security & Authentication)'],
      ['ul', [
        '<b>المصادقة:</b> تسجيل دخول يعيد JWT واحداً لمدة 8 ساعات؛ في الويب يُحفظ في cookie من نوع HttpOnly ولا يصل لكود المتصفح، وفي الموبايل في expo-secure-store.',
        '<b>حماية الـendpoints:</b> JwtAuthGuard (passport-jwt) على مستوى المتحكم، ويعيد تحميل الدور وحالة الحساب من قاعدة البيانات في كل طلب؛ الـendpoints العامة في متحكمات منفصلة.',
        '<b>الصلاحيات:</b> RoleAccessService.requireRole داخل الخدمات (403)، وموارد الآخرين تُخفى بـ404؛ المدقق لا يعتمد إدخاله.',
        '<b>كلمات المرور:</b> bcrypt؛ لا تُعاد passwordHash أو nationalIdHash في أي استجابة.',
        '<b>التحقق من المدخلات:</b> ValidationPipe عام (whitelist وforbidNonWhitelisted) وDTO بـ class-validator لكل طلب، وParseUUIDPipe للمعرّفات.',
        '<b>حماية إضافية:</b> تحديد معدل الدخول، فحص نوع الملف الحقيقي وحذف بيانات EXIF/الموقع وsha256، CORS محدد، سجل تدقيق لكل تعديل، ولا أسرار في Git.',
      ]],
      ['h', '9. قواعد العمل (Business Rules) — اختياري'],
      ['ul', [
        'الأموال التجريبية لا تُضاف أبداً إلى المبلغ المحقق أو مجاميع المنصة.',
        'المبلغ المصروف لا يتجاوز المحقق ناقص المصروف؛ الحملة الطبية تصرف للمشفى المعتمد فقط.',
        'كل مسار تبرع يرسل إشعاراً فورياً؛ الإيصال الرسمي يصدر بعد التحقق المالي فقط.',
      ]],
    ],
  },
  en: {
    title: 'Analysis & Design — Majlis Fund',
    sub: 'Team: TEAM_EN · B4F Hackathon · November 2026 · Repository: ' + REPO,
    blocks: [
      ['h', '1. System Overview'],
      ['p', '<b>Problem:</b> the Local Council of Salamiyah collects and spends donations by hand, with no single record and no published proof, so donors cannot confirm their donation arrived and the community cannot see where the money went.'],
      ['p', '<b>Goal:</b> automate the whole donation cycle (campaign → donation → verification → receipt → spending → transparency) to strengthen trust between the community and the council.'],
      ['p', '<b>Target audience:</b> the council and its staff, local and diaspora donors, the Mukhis at collection points, and the community.'],
      ['p', '<b>Scope:</b> campaigns in data-driven categories (medical, orphan sponsorship, home renovation, admin-defined) with a target amount; giving by transfer + receipt, simulated e-wallet («Demo») or cash via the Mukhi; instant notifications; finance verification and official receipt with QR; spending with proof; transparency dashboard; anonymised beneficiaries; management of users, points, hospitals and accounts; a donor mobile app.'],
      ['p', '<b>Out of scope:</b> a real payment gateway, the WhatsApp Business API, food baskets and education, joint approval, Aga Khan transfers and monthly reconciliation. All account numbers and data are fictional for the demo.'],
      ['h', '2. Actors / User Roles'],
      ['table', ['Role', 'What it does in the system'], [
        ['Donor (DONOR)', 'Browses campaigns, gives on every path, receives notifications and the official receipt, tracks their donations.'],
        ['«Mukhi» (COLLECTOR)', 'Confirms cash received at their own collection points only; never verifies or changes balances.'],
        ['Staff (STAFF)', 'Registers medical cases and in-person donations at the council desk.'],
        ['Case officer (CASE_OFFICER)', 'Reviews a medical case, sets priority, hospital and amount, publishes its campaign.'],
        ['Finance verifier (FINANCE_VERIFIER)', 'Approves or rejects donations, records spending with proof and monthly payments.'],
        ['Admin (ADMIN)', 'Manages categories, campaigns, users, collection points, hospitals, receiving accounts, imports and the audit log.'],
        ['Public visitor', 'Sees campaigns and the transparency dashboard and checks a receipt by QR without logging in.'],
      ]],
      ['h', '3. Functional Requirements'],
      ['ul', [
        'FR1 Log in with phone + password (optionally Google) and register a donor account.',
        'FR2 Manage campaign categories as data, with behaviour flags (medical case, locked hospital payee, monthly sponsorship).',
        'FR3 Create a campaign with category, target amount, anonymised summary and illustration; publish, pause and close it.',
        'FR4 Show public campaigns with the campaign account: verified, pending, demo, spent, remaining.',
        'FR5 Donate by transfer: a pledge with a reference and receiving account, then a receipt photo upload.',
        'FR6 Simulated e-payment (ShamCash, Syriatel Cash, MTN Cash, PayPal, Visa) with a «Demo» badge and no effect on verified totals.',
        'FR7 Donate cash by choosing a collection point; the Mukhi confirms receipt.',
        'FR8 Instant in-app notification and a WhatsApp outbox message for every donation.',
        'FR9 Finance verification (approve / reject with reason) issuing an official receipt R-YYYY-NNNNNN with a publicly verifiable QR.',
        'FR10 Record spending with payee type, amount, date and public-safe proof; monthly sponsorship payments.',
        'FR11 Public transparency dashboard and CSV export.',
        'FR12 Medical pipeline: intake → review → publish a campaign.',
        'FR13 Link beneficiaries to campaigns by code B-XXXX and import them from Excel/CSV.',
        'FR14 Audit log for every change and overdue-review alerts.',
      ]],
      ['h', '4. Non-Functional Requirements'],
      ['ul', [
        '<b>Security:</b> 8-hour JWT, bcrypt passwords, role-based permissions, validation of every input, login rate limit, file checks.',
        '<b>Privacy:</b> no beneficiary identity is ever public (code, kind and area only); national IDs stored as an HMAC.',
        '<b>Performance / low bandwidth:</b> server-rendered pages, light SVG charts, no heavy libraries or autoplay media.',
        '<b>Usability:</b> Arabic RTL first with English, WCAG-AA contrast, visible focus, dark and light modes.',
        '<b>Reliability:</b> every multi-row write in one transaction; demo money never mixed with verified money; audit log.',
        '<b>Responsiveness:</b> mobile-friendly web, installable collector PWA, Expo donor app.',
        '<b>Maintainability:</b> one module per domain, pinned versions, 392 backend unit tests, 53 frontend tests and a full Playwright scenario.',
      ]],
      ['h', '5. Use Cases'],
      ['uc', 'UC1 — Donate by transfer and get an official receipt', 'Donor, Finance verifier', [
        'The donor picks a campaign, an amount and "Bemo bank transfer".',
        'The system creates a pledge with a reference, shows the receiving account and sends an instant notification.',
        'The donor transfers outside the platform and uploads the receipt photo; the donation is "pending verification".',
        'A finance verifier (not the entry owner) approves; an official receipt with QR is issued and the campaign\'s verified amount grows.',
      ]],
      ['uc', 'UC2 — Give cash through the Mukhi', 'Donor, Mukhi, Finance verifier', [
        'The donor chooses "cash" and an active collection point and gets a reference.',
        'They hand the money to the Mukhi, who confirms receipt with one tap; the bar shows "received, pending verification".',
        'The finance verifier approves and the official receipt is issued; the Mukhi never verifies or changes balances.',
      ]],
      ['uc', 'UC3 — Record spending and show transparency', 'Finance verifier, Public visitor', [
        'The verifier records spending for a campaign: payee, amount (≤ verified − spent), date and public-safe proof.',
        'For a medical campaign the payee can only be the approved hospital.',
        'The dashboard shows collected, spent, remaining and beneficiaries by anonymous code; fully spent at target, the campaign becomes "Completed".',
      ]],
      ['img', 'use-cases.png', 'Use case diagram'],
      ['h', '6. Architecture Diagram'],
      ['p', 'Three apps in one repository: a Next.js server renders the pages and calls the API from the server only (token in an HttpOnly cookie); an Expo app calls the API directly with a token in SecureStore; the NestJS API owns every rule and stores data in PostgreSQL through Prisma, with local file storage and wa.me links for WhatsApp, with no external API.'],
      ['img', 'architecture.png', 'Architecture diagram'],
      ['h', '7. ERD / Database Design'],
      ['p', '21 tables with UUID primary keys and explicit foreign keys. Main relations: CampaignCategory 1—N Campaign; Campaign 1—N Pledge; Pledge 1—N Receipt and Verification; Campaign 1—N Expenditure (FK proofDocumentId → Document); Campaign N—N Beneficiary through CampaignBeneficiary; Case 1—1 Campaign; Hospital 1—N Case. Every table references User through a creator or reviewer FK.'],
      ['img', 'erd.png', 'Entity-relationship diagram with keys'],
      ['h', '8. Security & Authentication'],
      ['ul', [
        '<b>Authentication:</b> login returns one 8-hour JWT; on the web it lives in an HttpOnly cookie and never reaches browser code, on mobile in expo-secure-store.',
        '<b>Protected endpoints:</b> JwtAuthGuard (passport-jwt) at controller level, reloading role and account state from the database on every request; public endpoints live in separate controllers.',
        '<b>Authorization / roles:</b> RoleAccessService.requireRole inside services (403); others\' resources are hidden with 404; a verifier never verifies their own entry.',
        '<b>Password hashing:</b> bcrypt; passwordHash and nationalIdHash are never returned.',
        '<b>Input validation:</b> global ValidationPipe (whitelist, forbidNonWhitelisted) and a class-validator DTO for every request; ParseUUIDPipe for ids.',
        '<b>More:</b> login rate limit, real file-type check with EXIF/location stripping and sha256, restricted CORS, audit log for every change, no secrets in Git.',
      ]],
      ['h', '9. Business Rules (optional)'],
      ['ul', [
        'Demo money is never added to the verified amount or platform totals.',
        'Spending never exceeds verified − spent; a medical campaign pays only the approved hospital.',
        'Every donation path sends an instant notification; the official receipt is issued only after finance verification.',
      ]],
    ],
  },
};

module.exports = { brief, analysis, MEMBERS, REPO };
