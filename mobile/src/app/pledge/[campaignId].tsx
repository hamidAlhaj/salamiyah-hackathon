import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { type CreatePledgeResult, DEMO_PAYMENT_METHODS, type PledgeView } from '@/shared';
import { api, ApiError } from '@/lib/api';
import { AppText, Button, Card, Notice } from '@/ui/components';
import { fonts, radius, type, usePalette } from '@/ui/theme';

type DemoMethod = (typeof DEMO_PAYMENT_METHODS)[number];

/**
 * Existing pledge flow kept working as it was (P10 rebuilds the donate flow): pledge → transfer
 * instructions → receipt upload, plus the simulated «Demo» payment.
 */
export default function PledgeScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { t } = useTranslation();
  const c = usePalette();
  const [amount, setAmount] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePledgeResult | null>(null);
  const [demoDone, setDemoDone] = useState(false);

  const fail = (e: unknown) => {
    const code = e instanceof ApiError ? e.code : 'generic';
    setError(t(`errors.${code}`, { defaultValue: t('errors.generic') }));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(
        await api<CreatePledgeResult>('/pledges', {
          method: 'POST',
          body: { campaignId, amount, method: 'BEMO_TRANSFER', isAnonymousDisplay: anonymous },
        }),
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const simulate = async (method: DemoMethod) => {
    setBusy(true);
    setError(null);
    try {
      await api<PledgeView>('/pledges/demo', {
        method: 'POST',
        body: { campaignId, amount, method, isAnonymousDisplay: anonymous },
      });
      setDemoDone(true);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const { pledge, instructions } = result;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <AppText weight="bold">{t('pledge.instructions')}</AppText>
          <AppText>
            {t('pledge.reference')}: <AppText weight="bold">{pledge.referenceNo}</AppText>
          </AppText>
          {instructions.map((i) => (
            <View key={i.method} style={{ gap: 2 }}>
              <AppText>{i.bankName}</AppText>
              <AppText size="sm">
                {t('pledge.account')}: {i.accountName}
              </AppText>
              <AppText selectable size="lg" weight="bold" style={{ writingDirection: 'ltr' }}>
                {i.accountNumber}
              </AppText>
              <AppText size="xs" tone="muted">
                {i.note}
              </AppText>
            </View>
          ))}
          <AppText size="xs" tone="muted">
            {t('pledge.then')}
          </AppText>
        </Card>
        <Button title={t('pledge.uploadNow')} onPress={() => router.replace(`/receipt/${pledge.id}`)} />
        <Button title={t('pledge.later')} variant="secondary" onPress={() => router.replace('/donations')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.page }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText weight="medium">{t('pledge.amount')}</AppText>
      <TextInput
        style={{
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
        }}
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
        accessibilityLabel={t('pledge.amount')}
        keyboardType="number-pad"
        placeholder="500000"
        placeholderTextColor={c.muted}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText size="sm" style={{ flex: 1 }}>
          {t('pledge.anonymous')}
        </AppText>
        <Switch
          value={anonymous}
          onValueChange={setAnonymous}
          accessibilityLabel={t('pledge.anonymous')}
          trackColor={{ true: c.accent, false: c.track }}
        />
      </View>
      <AppText size="sm" tone="muted">
        {t('pledge.method')}: {t('pledge.bemo')}
      </AppText>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button title={t('pledge.submit')} variant="give" onPress={() => void submit()} loading={busy} disabled={!amount} />

      <Card style={{ borderStyle: 'dashed', marginTop: 12 }}>
        <AppText weight="bold" tone="warning">
          {t('pledge.demoTitle')}
        </AppText>
        <AppText size="xs" tone="muted">
          {t('pledge.demoNote')}
        </AppText>
        {demoDone ? (
          <Notice tone="success">{t('pledge.demoDone')}</Notice>
        ) : (
          DEMO_PAYMENT_METHODS.map((m) => (
            <Button
              key={m}
              title={t('pledge.demoPay', { method: t(`methods.${m}`) })}
              variant="secondary"
              disabled={!amount || busy}
              onPress={() => void simulate(m)}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}
