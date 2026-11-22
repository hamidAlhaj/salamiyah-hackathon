import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { getItem, setItem } from '@/lib/storage';

const ar = {
  appName: 'مجلس فند',
  council: 'المجلس المحلي في السلمية',
  myDonations: 'تبرعاتي',
  login: 'دخول',
  logout: 'تسجيل الخروج',
  language: 'English',
  languageLabel: 'Switch to English',
  restartForDirection: 'أعد تشغيل التطبيق لتطبيق اتجاه الكتابة الجديد.',
  offline: 'تعذّر الاتصال بالخادم. تُعرض آخر بيانات محمّلة.',
  retry: 'إعادة المحاولة',
  browse: {
    title: 'حملات المجلس',
    intro: 'كفالة أيتام، ترميم منازل، مساعدات طبية — لكل حملة هدف وحساب مفتوح.',
    all: 'الكل',
    categoriesLabel: 'تصنيفات الحملات',
    priorityLabel: 'الأولوية',
    priorityAll: 'كل الأولويات',
    empty: 'لا توجد حملات منشورة في هذا التصنيف حالياً.',
    showAll: 'عرض كل الحملات',
  },
  priority: { VERY_URGENT: 'طارئ جداً', URGENT: 'عاجل', NORMAL: 'اعتيادي' },
  campaign: {
    verified: 'جُمع (متحقق منه)',
    pending: 'بانتظار التحقق',
    demo: 'تجريبي',
    demoBadge: 'Demo',
    target: 'الهدف',
    spent: 'صُرف',
    remaining: 'المتبقي في الحساب',
    account: 'حساب الحملة',
    accountNote: 'المتبقي = ما جُمع وتحقق منه − ما صُرف.',
    demoNote: 'المدفوعات التجريبية لعرض الهاكاثون لا تُحسب ضمن المبالغ الحقيقية ولا الرصيد.',
    progressLabel: 'تقدّم الحملة نحو هدفها',
    ofTarget: 'من {{target}}',
    beneficiaries_zero: 'لا مستفيدين بعد',
    beneficiaries_one: 'مستفيد واحد',
    beneficiaries_two: 'مستفيدان',
    beneficiaries_few: '{{count}} مستفيدين',
    beneficiaries_many: '{{count}} مستفيداً',
    beneficiaries_other: '{{count}} مستفيد',
    donors_zero: 'لا متبرعين بعد',
    donors_one: 'متبرع واحد',
    donors_two: 'متبرعان',
    donors_few: '{{count}} متبرعين',
    donors_many: '{{count}} متبرعاً',
    donors_other: '{{count}} متبرع',
    beneficiariesTitle: 'المستفيدون',
    beneficiariesNote: 'نعرض رمز كل مستفيد ونوعه ومنطقته فقط، ولا نكشف أي هوية.',
    beneficiariesEmpty: 'لم يُربط مستفيدون بهذه الحملة بعد.',
    kinds: { PATIENT: 'مريض', ORPHAN: 'يتيم', FAMILY: 'أسرة', OTHER: 'مستفيد' },
    monthly: '{{amount}} شهرياً',
    since: 'منذ {{date}}',
    receivingTitle: 'حسابات الاستلام',
    receivingNote: 'أرقام حسابات تجريبية لعرض الهاكاثون. اكتب رقم مرجع تبرعك في ملاحظة التحويل.',
    campaignAccount: 'خاص بهذه الحملة',
    copy: 'نسخ',
    copied: 'تم النسخ',
    copyLabel: 'نسخ رقم حساب {{method}}',
    demoCheckout: 'دفع تجريبي متاح',
    donateNow: 'تبرّع الآن',
    notAccepting: 'الحملة لا تستقبل تبرعات حالياً.',
    hospital: 'المشفى المعتمد',
    anonymous: 'حالة محمية الهوية',
    ongoing: 'برنامج مستمر',
    completed: 'تم الإنجاز',
    updates: 'آخر التحديثات',
    share: 'شارك عبر واتساب',
    shareText: 'ساهم في «{{title}}» عبر مجلس فند — {{percent}}% من الهدف تحقق. {{url}}',
  },
  auth: {
    loginTitle: 'تسجيل الدخول',
    loginIntro: 'ادخل برقم هاتفك لتتابع تبرعاتك وإيصالاتك.',
    registerTitle: 'حساب متبرع جديد',
    fullName: 'الاسم الكامل (يظهر على الإيصال الرسمي)',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    whatsappOptIn: 'أرسلوا لي الإيصالات وتنبيهات الحملات الجديدة عبر واتساب',
    submitLogin: 'دخول',
    submitRegister: 'إنشاء الحساب',
    toRegister: 'ليس لديك حساب؟ أنشئ حساباً',
    toLogin: 'لديك حساب؟ سجّل الدخول',
    invalid: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
    invalidPhone: 'اكتب رقم هاتف صحيحاً، مثل 0944123456.',
    weakPassword: 'كلمة المرور 8 أحرف على الأقل.',
    phoneTaken: 'هذا الرقم مسجّل مسبقاً. سجّل الدخول بدلاً من ذلك.',
    staffTitle: 'هذا التطبيق للمتبرعين',
    staffBody: 'حسابك حساب موظف في المجلس. استخدم لوحة الويب لإدارة الحالات والحملات والتحقق المالي.',
    staffOpenWeb: 'فتح لوحة الويب',
    sessionEnded: 'انتهت جلستك. سجّل الدخول من جديد.',
  },
  donations: {
    empty: 'لم تتبرع بعد. اختر حملة وابدأ.',
    rejection: 'السبب: {{reason}}',
    official: 'عرض الإيصال الرسمي',
  },
  status: {
    PLEDGED: 'بانتظار رفع الإيصال',
    RECEIPT_UPLOADED: 'قيد التحقق',
    COLLECTED: 'استُلم، بانتظار التحقق',
    VERIFIED: 'تم التحقق',
    REJECTED: 'مرفوض',
    CANCELLED: 'ملغى',
    DEMO_CONFIRMED: 'دفع تجريبي',
  },
  pledge: {
    title: 'تعهّد بالتبرع',
    amount: 'المبلغ (ل.س)',
    anonymous: 'أظهرني كـ«فاعل خير» (الإيصال الرسمي يبقى باسمي)',
    method: 'طريقة التحويل',
    bemo: 'تحويل عبر بنك بيمو',
    submit: 'تأكيد التعهد',
    instructions: 'تعليمات التحويل',
    reference: 'رقم التعهد',
    account: 'الحساب',
    then: 'بعد التحويل صوّر الإيصال وارفعه.',
    uploadNow: 'ارفع الإيصال الآن',
    later: 'لاحقاً من «تبرعاتي»',
    demoTitle: 'وضع العرض (Demo)',
    demoNote: 'محاكاة دفع فوري للعرض فقط — لا يتم أي دفع حقيقي.',
    demoPay: 'محاكاة دفع عبر {{method}}',
    demoDone: 'تمت المحاكاة.',
  },
  receipt: {
    title: 'رفع إيصال التحويل',
    camera: 'تصوير الإيصال',
    gallery: 'اختيار من الصور',
    transferRef: 'رقم مرجع التحويل (اختياري)',
    upload: 'رفع الإيصال',
    uploading: 'جارٍ الضغط والرفع…',
    done: 'تم الرفع. سيتحقق المدقق المالي ويصلك إشعار.',
    permission: 'نحتاج إذن الكاميرا لتصوير الإيصال.',
  },
  methods: {
    BEMO_TRANSFER: 'حوالة بنك بيمو',
    BANK_TRANSFER: 'حوالة مصرفية',
    SHAM_CASH: 'شام كاش',
    SYRIATEL_CASH: 'سيريتل كاش',
    MTN_CASH: 'MTN كاش',
    PAYPAL: 'PayPal',
    VISA: 'Visa',
    CASH: 'نقداً',
  },
  errors: {
    generic: 'حدث خطأ. حاول مرة أخرى.',
    notFound: 'لم نجد هذه الحملة.',
    campaign_not_accepting_pledges: 'الحملة لا تستقبل تبرعات حالياً.',
    duplicate_receipt: 'هذا الإيصال مرفوع مسبقاً لتعهد آخر.',
    unsupported_file_type: 'نوع الملف غير مدعوم.',
    file_too_large: 'الملف كبير جداً.',
    demo_mode_disabled: 'وضع العرض غير مفعّل.',
  },
};

type Messages = typeof ar;

const en: Messages = {
  appName: 'Majlis Fund',
  council: 'Salamiyah Local Council',
  myDonations: 'My donations',
  login: 'Log in',
  logout: 'Log out',
  language: 'العربية',
  languageLabel: 'التبديل إلى العربية',
  restartForDirection: 'Restart the app to apply the new text direction.',
  offline: 'Could not reach the server. Showing the last loaded data.',
  retry: 'Retry',
  browse: {
    title: 'Council campaigns',
    intro: 'Orphan sponsorship, home renovation, medical aid — every campaign has a goal and an open account.',
    all: 'All',
    categoriesLabel: 'Campaign categories',
    priorityLabel: 'Priority',
    priorityAll: 'All priorities',
    empty: 'No published campaigns in this category right now.',
    showAll: 'Show all campaigns',
  },
  priority: { VERY_URGENT: 'Critical', URGENT: 'Urgent', NORMAL: 'Normal' },
  campaign: {
    verified: 'Collected (verified)',
    pending: 'Awaiting verification',
    demo: 'Demo',
    demoBadge: 'Demo',
    target: 'Target',
    spent: 'Spent',
    remaining: 'Remaining in the account',
    account: 'Campaign account',
    accountNote: 'Remaining = collected and verified − spent.',
    demoNote: 'Simulated hackathon payments never count toward real amounts or the balance.',
    progressLabel: 'Campaign progress toward its goal',
    ofTarget: 'of {{target}}',
    beneficiaries_zero: 'No beneficiaries yet',
    beneficiaries_one: '{{count}} beneficiary',
    beneficiaries_two: '{{count}} beneficiaries',
    beneficiaries_few: '{{count}} beneficiaries',
    beneficiaries_many: '{{count}} beneficiaries',
    beneficiaries_other: '{{count}} beneficiaries',
    donors_zero: 'No donors yet',
    donors_one: '{{count}} donor',
    donors_two: '{{count}} donors',
    donors_few: '{{count}} donors',
    donors_many: '{{count}} donors',
    donors_other: '{{count}} donors',
    beneficiariesTitle: 'Beneficiaries',
    beneficiariesNote: 'Only each beneficiary’s code, kind and area are shown. No identities.',
    beneficiariesEmpty: 'No beneficiaries are linked to this campaign yet.',
    kinds: { PATIENT: 'Patient', ORPHAN: 'Orphan', FAMILY: 'Family', OTHER: 'Beneficiary' },
    monthly: '{{amount}} a month',
    since: 'Since {{date}}',
    receivingTitle: 'Receiving accounts',
    receivingNote: 'Demo account numbers for the hackathon. Put your donation reference in the transfer note.',
    campaignAccount: 'This campaign only',
    copy: 'Copy',
    copied: 'Copied',
    copyLabel: 'Copy the {{method}} account number',
    demoCheckout: 'Demo payment available',
    donateNow: 'Donate now',
    notAccepting: 'This campaign is not accepting donations right now.',
    hospital: 'Approved hospital',
    anonymous: 'Identity-protected case',
    ongoing: 'Ongoing programme',
    completed: 'Completed',
    updates: 'Latest updates',
    share: 'Share on WhatsApp',
    shareText: 'Support “{{title}}” on Majlis Fund — {{percent}}% of the goal is verified. {{url}}',
  },
  auth: {
    loginTitle: 'Log in',
    loginIntro: 'Log in with your phone number to follow your donations and receipts.',
    registerTitle: 'New donor account',
    fullName: 'Full name (shown on the official receipt)',
    phone: 'Phone number',
    password: 'Password',
    whatsappOptIn: 'Send me receipts and new-campaign alerts on WhatsApp',
    submitLogin: 'Log in',
    submitRegister: 'Create account',
    toRegister: 'No account? Create one',
    toLogin: 'Have an account? Log in',
    invalid: 'Wrong phone number or password.',
    invalidPhone: 'Enter a valid phone number, e.g. 0944123456.',
    weakPassword: 'The password needs at least 8 characters.',
    phoneTaken: 'This number is already registered. Log in instead.',
    staffTitle: 'This app is for donors',
    staffBody: 'Your account is a council staff account. Use the web dashboard to manage cases, campaigns and verification.',
    staffOpenWeb: 'Open the web dashboard',
    sessionEnded: 'Your session ended. Please log in again.',
  },
  donations: {
    empty: 'You have not donated yet. Pick a campaign to start.',
    rejection: 'Reason: {{reason}}',
    official: 'View official receipt',
  },
  status: {
    PLEDGED: 'Awaiting receipt',
    RECEIPT_UPLOADED: 'Being verified',
    COLLECTED: 'Received, awaiting verification',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    DEMO_CONFIRMED: 'Demo payment',
  },
  pledge: {
    title: 'Pledge a donation',
    amount: 'Amount (SYP)',
    anonymous: 'Show me as “Anonymous” (the official receipt stays in my name)',
    method: 'Transfer method',
    bemo: 'Bank Bemo transfer',
    submit: 'Confirm pledge',
    instructions: 'Transfer instructions',
    reference: 'Pledge no.',
    account: 'Account',
    then: 'After transferring, photograph the receipt and upload it.',
    uploadNow: 'Upload receipt now',
    later: 'Later from “My donations”',
    demoTitle: 'Demo mode',
    demoNote: 'Instant payment simulation for the demo only — no real payment happens.',
    demoPay: 'Simulate payment via {{method}}',
    demoDone: 'Simulation done.',
  },
  receipt: {
    title: 'Upload transfer receipt',
    camera: 'Take a photo',
    gallery: 'Choose from photos',
    transferRef: 'Transfer reference (optional)',
    upload: 'Upload receipt',
    uploading: 'Compressing and uploading…',
    done: 'Uploaded. The finance verifier will check it and you will be notified.',
    permission: 'Camera permission is needed to photograph the receipt.',
  },
  methods: {
    BEMO_TRANSFER: 'Bemo bank transfer',
    BANK_TRANSFER: 'Bank transfer',
    SHAM_CASH: 'ShamCash',
    SYRIATEL_CASH: 'Syriatel Cash',
    MTN_CASH: 'MTN Cash',
    PAYPAL: 'PayPal',
    VISA: 'Visa',
    CASH: 'Cash',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    notFound: 'We could not find this campaign.',
    campaign_not_accepting_pledges: 'This campaign is not accepting donations right now.',
    duplicate_receipt: 'This receipt was already uploaded for another pledge.',
    unsupported_file_type: 'Unsupported file type.',
    file_too_large: 'The file is too large.',
    demo_mode_disabled: 'Demo mode is disabled.',
  },
};

export type Lang = 'ar' | 'en';
const LANG_KEY = 'mf_lang';

/** Applies the reading direction. Web switches at once; native applies it on the next app start. */
function applyDirection(lang: Lang): boolean {
  const rtl = lang === 'ar';
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    return false;
  }
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.forceRTL(rtl);
  return true;
}

const i18n = createInstance();
// Arabic by default (like the web); English when the donor chose it (saved on the phone).
void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});
applyDirection('ar');

/** Restores the saved language at start-up. */
export async function restoreLanguage(): Promise<void> {
  const saved = await getItem(LANG_KEY);
  if (saved === 'en' || saved === 'ar') {
    await i18n.changeLanguage(saved);
    applyDirection(saved);
  }
}

/** Switches and saves the language; returns true when native needs a restart for the direction. */
export async function setLanguage(lang: Lang): Promise<boolean> {
  await setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
  return applyDirection(lang);
}

/** The current UI language, for number/date formatting and the `lang` API parameter. */
export function useLang(): Lang {
  const { i18n: instance } = useTranslation();
  return instance.language === 'en' ? 'en' : 'ar';
}

export default i18n;
