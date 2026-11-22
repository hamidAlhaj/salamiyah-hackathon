import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import type {
  CampaignLedger,
  CreatePledgeResult,
  Currency,
  PaymentAccount,
  PledgeView,
  PublicCollectionPoint,
} from '@/shared';
import { useLang } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { AppText, Button, Card, Chip, DemoBadge, Notice, styles } from '@/ui/components';
import { fonts, radius, type, usePalette } from '@/ui/theme';

type Path = 'demo' | 'transfer' | 'cash';

const PRESETS: Record<Currency, number[]> = {
  SYP: [25_000, 50_000, 100_000, 250_000],
  USD: [10, 25, 50, 100],
};
/** The fixed demo confirmation code, shown on screen (no SMS is sent). */
const DEMO_OTP = '246810';

/**
 * Donate on every path, like the web flow: simulated e-payment («Demo», DEMO_CONFIRMED), transfer →
 * account + reference → receipt photo, or cash at a collection point → reference.
 */
export default function DonateScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const [ledger, setLedger] = useState<CampaignLedger | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [points, setPoints] = useState<PublicCollectionPoint[]>([]);
  const [loadError, setLoadError] = useState(false);

  const [path, setPath] = useState<Path | null>(null);
  const [method, setMethod] = useState<PaymentAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [pointId, setPointId] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<CreatePledgeResult | null>(null);
  const [done, setDone] = useState<PledgeView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [l, a, p] = await Promise.all([
        api<CampaignLedger>(`/campaigns/${campaignId}/ledger`, { auth: false }),
        api<PaymentAccount[]>(`/campaigns/${campaignId}/payment-accounts`, {
          auth: false,
          query: { lang },
        }),
        api<PublicCollectionPoint[]>('/collection-points/active', { auth: false }),
      ]);
      setLedger(l);
      setAccounts(a);
      setPoints(p);
    } catch {
      setLoadError(true);
    }
  }, [campaignId, lang]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const methodsFor = useMemo(
    () => ({
      demo: accounts.filter((a) => a.allowsDemoCheckout && (a.kind === 'WALLET' || a.kind === 'CARD')),
      transfer: accounts.filter((a) => a.allowsReceiptUpload),
      cash: accounts.filter((a) => a.kind === 'CASH'),
    }),
    [accounts],
  );

  if (loadError) return <View style={{ padding: 16 }}><Notice tone="danger">{t('errors.generic')}</Notice></View>;
  if (!ledger) return <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />;

  const currency = ledger.currency;
  const m = (v: string | number) => money(v, currency, lang);
  const amountOk = /^[1-9][0-9]{0,11}$/.test(amount);
  const ready = method !== null && amountOk;
  const locked = transfer !== null;
  const body = { campaignId, amount, isAnonymousDisplay: anonymous };

  const fail = (e: unknown) => {
    const code = e instanceof ApiError ? e.code : 'generic';
    setError(t(`errors.${code}`, { defaultValue: t('errors.generic') }));
  };
  const submit = async <T,>(run: () => Promise<T>, onData: (d: T) => void) => {
    setBusy(true);
    setError(null);
    try {
      onData(await run());
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const choosePath = (p: Path) => {
    setPath(p);
    setMethod(methodsFor[p].length === 1 ? methodsFor[p][0] : null);
    setError(null);
  };

  const screen = { flex: 1, backgroundColor: c.page } as const;

  if (done) {
    const isCash = done.method === 'CASH';
    return (
      <ScrollView style={screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card testID="donation-done">
          <AppText display size="xl">
            {done.isDemo ? t('pledge.doneDemo') : t('pledge.doneCash')}
          </AppText>
          <AppText size="sm" tone="muted">
            {isCash && done.collectionPoint
              ? t('pledge.doneCashBody', { point: done.collectionPoint.name, area: done.collectionPoint.area })
              : t('pledge.doneDemoBody')}
          </AppText>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText size="sm" tone="muted">{t('pledge.reference')}</AppText>
            <AppText size="lg" weight="bold" testID="done-reference">{done.referenceNo}</AppText>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText size="sm" tone="muted">{method?.label}</AppText>
            <View style={styles.row}>
              <AppText weight="bold">{m(done.amount)}</AppText>
              {done.isDemo && <DemoBadge />}
            </View>
          </View>
        </Card>
        <Button title={t('pledge.backToCampaign')} onPress={() => router.back()} />
        <Button title={t('myDonations')} variant="secondary" onPress={() => router.replace('/donations')} />
      </ScrollView>
    );
  }

  const pointsByArea = Object.entries(
    points.reduce<Record<string, PublicCollectionPoint[]>>((acc, p) => {
      (acc[p.area] ??= []).push(p);
      return acc;
    }, {}),
  );
  const paths = (['demo', 'transfer', 'cash'] as const).filter((p) => methodsFor[p].length > 0);

  return (
    <ScrollView style={screen} contentContainerStyle={{ padding: 16, gap: 18 }} keyboardShouldPersistTaps="handled">
      {/* 1. Path and method */}
      <View style={{ gap: 10 }} pointerEvents={locked ? 'none' : 'auto'}>
        <StepTitle n={1} title={t('pledge.stepPath')} />
        {paths.map((p) => {
          const active = path === p;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => choosePath(p)}
              testID={`path-${p}`}
              style={{
                borderWidth: 2,
                borderRadius: radius.lg,
                padding: 14,
                gap: 2,
                borderColor: active ? c.accent : c.border,
                backgroundColor: active ? c.accentSoft : c.surface,
              }}
            >
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <AppText weight="bold">{t(`pledge.paths.${p}`)}</AppText>
                {p === 'demo' && <DemoBadge />}
              </View>
              <AppText size="xs" tone="muted">{t(`pledge.paths.${p}Body`)}</AppText>
            </Pressable>
          );
        })}
        {path && path !== 'cash' && methodsFor[path].length > 1 && (
          <View style={{ gap: 8 }}>
            <AppText size="sm" weight="medium">{t('pledge.method')}</AppText>
            <View style={[styles.row, { gap: 8 }]}>
              {methodsFor[path].map((a) => (
                <Chip
                  key={a.method}
                  label={a.label}
                  selected={method?.method === a.method}
                  onPress={() => setMethod(a)}
                  testID={`method-${a.method}`}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 2. Amount */}
      <View style={{ gap: 10 }} pointerEvents={locked ? 'none' : 'auto'}>
        <StepTitle n={2} title={t('pledge.stepAmount')} />
        <View style={[styles.row, { gap: 8 }]}>
          {PRESETS[currency].map((p) => (
            <Chip
              key={p}
              label={m(p)}
              selected={amount === String(p)}
              onPress={() => setAmount(String(p))}
              testID={`preset-${p}`}
            />
          ))}
        </View>
        <AppText size="sm" weight="medium">{t('pledge.amount')}</AppText>
        <TextInput
          style={inputStyle(c)}
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/\D/g, '').slice(0, 12))}
          accessibilityLabel={t('pledge.amount')}
          keyboardType="number-pad"
          testID="amount"
        />
        <AppText size="xs" tone="muted">{t('pledge.amountHint', { currency })}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppText size="sm" style={{ flex: 1 }}>{t('pledge.anonymous')}</AppText>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            accessibilityLabel={t('pledge.anonymous')}
            trackColor={{ true: c.accent, false: c.track }}
          />
        </View>
      </View>

      {/* 3. Finish */}
      <View style={{ gap: 10 }}>
        <StepTitle n={3} title={t('pledge.stepFinish')} />
        {!ready ? (
          <Notice tone="muted">{t('pledge.chooseFirst')}</Notice>
        ) : path === 'demo' && method ? (
          <DemoPanel
            account={method}
            amountLabel={m(amount)}
            busy={busy}
            error={error}
            onPay={() =>
              void submit(
                () => api<PledgeView>('/pledges/demo', { method: 'POST', body: { ...body, method: method.method } }),
                setDone,
              )
            }
          />
        ) : path === 'transfer' && method ? (
          transfer ? (
            <TransferPanel result={transfer} amountLabel={m(transfer.pledge.amount)} />
          ) : (
            <View style={{ gap: 10 }}>
              {error && <Notice tone="danger">{error}</Notice>}
              <Button
                title={t('pledge.showAccount')}
                variant="give"
                loading={busy}
                testID="transfer-create"
                onPress={() =>
                  void submit(
                    () =>
                      api<CreatePledgeResult>('/pledges', { method: 'POST', body: { ...body, method: method.method } }),
                    setTransfer,
                  )
                }
              />
            </View>
          )
        ) : path === 'cash' ? (
          points.length === 0 ? (
            <Notice tone="muted">{t('pledge.noPoints')}</Notice>
          ) : (
            <View style={{ gap: 12 }} testID="cash-points">
              <AppText size="sm" weight="medium">{t('pledge.pointsTitle')}</AppText>
              {pointsByArea.map(([area, list]) => (
                <View key={area} style={{ gap: 6 }}>
                  <AppText size="xs" tone="muted" weight="bold">{area}</AppText>
                  {list.map((p) => (
                    <Pressable
                      key={p.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: pointId === p.id }}
                      onPress={() => setPointId(p.id)}
                      testID={`point-${p.id}`}
                      style={[
                        styles.row,
                        {
                          justifyContent: 'space-between',
                          borderWidth: 2,
                          borderRadius: radius.md,
                          padding: 12,
                          borderColor: pointId === p.id ? c.accent : c.border,
                          backgroundColor: pointId === p.id ? c.accentSoft : c.surface,
                        },
                      ]}
                    >
                      <AppText weight="medium">{p.name}</AppText>
                      <AppText size="xs" tone="muted">{t(`pledge.pointTypes.${p.type}`)}</AppText>
                    </Pressable>
                  ))}
                </View>
              ))}
              {error && <Notice tone="danger">{error}</Notice>}
              <Button
                title={t('pledge.getReference')}
                variant="give"
                loading={busy}
                testID="cash-confirm"
                onPress={() => {
                  if (!pointId) return setError(t('pledge.choosePoint'));
                  void submit(
                    () =>
                      api<PledgeView>('/pledges/cash', {
                        method: 'POST',
                        body: { ...body, collectionPointId: pointId },
                      }),
                    setDone,
                  );
                }}
              />
            </View>
          )
        ) : null}
      </View>
    </ScrollView>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  const c = usePalette();
  return (
    <View style={[styles.row, { gap: 8 }]}>
      <View
        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
      >
        <AppText size="xs" weight="bold" style={{ color: c.surface }}>{String(n)}</AppText>
      </View>
      <AppText weight="bold">{title}</AppText>
    </View>
  );
}

const inputStyle = (c: ReturnType<typeof usePalette>) =>
  ({
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.control,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: type.base,
    fontFamily: fonts.body,
    color: c.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  }) as const;

/**
 * Simulated checkout per method kind. Nothing typed here is sent: the card fields are read-only test
 * values, and the wallet number and code are only checked on the phone.
 */
function DemoPanel({
  account,
  amountLabel,
  busy,
  error,
  onPay,
}: {
  account: PaymentAccount;
  amountLabel: string;
  busy: boolean;
  error: string | null;
  onPay: () => void;
}) {
  const { t } = useTranslation();
  const c = usePalette();
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const isCard = account.kind === 'CARD';
  const isPaypal = account.method === 'PAYPAL';

  const readOnly = (label: string, value: string) => (
    <View style={{ gap: 4 }}>
      <AppText size="xs" tone="muted">{label}</AppText>
      <TextInput style={[inputStyle(c), { backgroundColor: c.surfaceMuted }]} value={value} editable={false} />
    </View>
  );

  return (
    <Card testID="demo-checkout">
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <AppText weight="bold">{account.label}</AppText>
        <DemoBadge />
      </View>
      <Notice tone="muted">{t('pledge.demoNote')}</Notice>
      {isPaypal ? (
        <View style={{ gap: 8 }}>
          <AppText size="xs" tone="muted">{t('pledge.paypalAccount')}</AppText>
          <AppText weight="medium" style={{ writingDirection: 'ltr' }}>demo.donor@example.com</AppText>
          <AppText size="sm">{t('pledge.paypalTo')}</AppText>
          <Button title={t('pledge.paypalApprove', { amount: amountLabel })} variant="give" loading={busy} onPress={onPay} testID="demo-pay" />
        </View>
      ) : isCard ? (
        <View style={{ gap: 8 }}>
          <AppText size="xs" tone="warning" weight="medium">{t('pledge.cardNote')}</AppText>
          {readOnly(t('pledge.cardNumber'), '4242 4242 4242 4242')}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>{readOnly(t('pledge.cardExpiry'), '12 / 30')}</View>
            <View style={{ flex: 1 }}>{readOnly(t('pledge.cardCvc'), '123')}</View>
          </View>
          <Button title={t('pledge.pay', { amount: amountLabel })} variant="give" loading={busy} onPress={onPay} testID="demo-pay" />
        </View>
      ) : !sentTo ? (
        <View style={{ gap: 8 }}>
          <AppText size="sm" weight="medium">{t('pledge.walletPhone')}</AppText>
          <TextInput
            style={inputStyle(c)}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^0-9+]/g, '').slice(0, 15))}
            keyboardType="phone-pad"
            accessibilityLabel={t('pledge.walletPhone')}
            testID="wallet-phone"
          />
          {localError && <Notice tone="danger">{localError}</Notice>}
          <Button
            title={t('pledge.sendCode')}
            testID="send-code"
            onPress={() => {
              if (!/^(\+?963|0)?9\d{8}$/.test(phone)) return setLocalError(t('pledge.invalidPhone'));
              setLocalError(null);
              setSentTo(phone);
            }}
          />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <AppText size="sm">{t('pledge.codeSent', { phone: sentTo })}</AppText>
          <Notice tone="success">{t('pledge.demoCode', { code: DEMO_OTP })}</Notice>
          <AppText size="sm" weight="medium">{t('pledge.code')}</AppText>
          <TextInput
            style={[inputStyle(c), { textAlign: 'center', letterSpacing: 6 }]}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            accessibilityLabel={t('pledge.code')}
            testID="wallet-code"
          />
          {localError && <Notice tone="danger">{localError}</Notice>}
          <Button
            title={t('pledge.confirmPay', { amount: amountLabel })}
            variant="give"
            loading={busy}
            testID="demo-pay"
            onPress={() => {
              if (code !== DEMO_OTP) return setLocalError(t('pledge.wrongCode'));
              setLocalError(null);
              onPay();
            }}
          />
        </View>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </Card>
  );
}

function TransferPanel({ result, amountLabel }: { result: CreatePledgeResult; amountLabel: string }) {
  const { t } = useTranslation();
  const c = usePalette();
  const account = result.instructions[0];
  const ref = result.pledge.referenceNo;
  const copy = (value: string) => void Clipboard.setStringAsync(value);
  return (
    <View style={{ gap: 12 }} testID="transfer-details">
      <Card>
        <AppText weight="bold">{t('pledge.accountTitle')}</AppText>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <AppText size="sm" tone="muted">{t('pledge.amountToSend')}</AppText>
          <AppText size="lg" weight="bold">{amountLabel}</AppText>
        </View>
        {account && (
          <View style={{ gap: 4 }}>
            <AppText size="sm" tone="muted">{account.bankName}</AppText>
            <AppText size="sm">{account.accountName}</AppText>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <AppText selectable weight="bold" style={{ writingDirection: 'ltr' }}>{account.accountNumber}</AppText>
              <Button title={t('campaign.copy')} variant="secondary" onPress={() => copy(account.accountNumber)} />
            </View>
          </View>
        )}
        <View style={[styles.row, { justifyContent: 'space-between', backgroundColor: c.warningSoft, padding: 10, borderRadius: radius.sm }]}>
          <AppText size="sm" weight="medium">{t('pledge.reference')}</AppText>
          <View style={styles.row}>
            <AppText selectable weight="bold" testID="pledge-reference">{ref}</AppText>
            <Button title={t('campaign.copy')} variant="secondary" onPress={() => copy(ref)} />
          </View>
        </View>
        <AppText size="xs" tone="muted">{t('pledge.referenceHint')}</AppText>
      </Card>
      <Button title={t('pledge.uploadNow')} variant="give" onPress={() => router.replace(`/receipt/${result.pledge.id}`)} />
      <Button title={t('pledge.later')} variant="secondary" onPress={() => router.replace('/donations')} />
    </View>
  );
}
