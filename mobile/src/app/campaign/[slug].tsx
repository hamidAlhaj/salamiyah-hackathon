import * as Clipboard from 'expo-clipboard';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import {
  type CampaignLedger,
  type PaymentAccount,
  progressPercent,
  type PublicBeneficiary,
  type PublicCampaignDetail,
  whatsappShareUrl,
} from '@/shared';
import { useLang } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { date, money } from '@/lib/format';
import { CampaignCover } from '@/ui/CampaignCover';
import {
  AppText,
  Button,
  Card,
  CategoryBadge,
  DemoBadge,
  FundingBar,
  Notice,
  PriorityBadge,
  styles,
} from '@/ui/components';
import { radius, usePalette } from '@/ui/theme';

interface Loaded {
  campaign: PublicCampaignDetail;
  ledger: CampaignLedger;
  accounts: PaymentAccount[];
  beneficiaries: PublicBeneficiary[];
}

/**
 * Campaign detail: summary, the campaign account (ledger from GET /campaigns/:id/ledger), receiving
 * accounts with copy, anonymised beneficiaries (code, kind, area only) and the donate button.
 */
export default function CampaignScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const { user } = useAuth();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<'notFound' | 'generic' | null>(null);

  const load = useCallback(async () => {
    try {
      const campaign = await api<PublicCampaignDetail>(`/campaigns/${encodeURIComponent(slug)}`, {
        auth: false,
        query: { lang },
      });
      const [ledger, accounts, beneficiaries] = await Promise.all([
        api<CampaignLedger>(`/campaigns/${campaign.id}/ledger`, { auth: false }),
        api<PaymentAccount[]>(`/campaigns/${campaign.id}/payment-accounts`, {
          auth: false,
          query: { lang },
        }),
        api<PublicBeneficiary[]>(`/campaigns/${campaign.id}/beneficiaries`, { auth: false }),
      ]);
      setData({ campaign, ledger, accounts, beneficiaries });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? 'notFound' : 'generic');
    }
  }, [slug, lang]);

  // Reload on focus: the ledger is fresh again after the donor returns from a pledge.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (error) {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Notice tone="danger">{t(`errors.${error}`)}</Notice>
        {error === 'generic' && (
          <Button
            title={t('retry')}
            variant="secondary"
            onPress={() => {
              setError(null);
              void load();
            }}
          />
        )}
      </View>
    );
  }
  if (!data) return <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />;

  const { campaign: cp, ledger, accounts, beneficiaries } = data;
  const m = (v: string) => money(v, ledger.currency, lang);
  // The pledge screens (P10 extends them) need a donor session first.
  const donate = () => router.push(user ? `/pledge/${cp.id}` : '/login');
  const share = () =>
    void Linking.openURL(
      whatsappShareUrl(
        t('campaign.shareText', {
          title: cp.title,
          percent: progressPercent(ledger.verifiedAmount, ledger.targetAmount),
          url: `${SITE_URL}/campaigns/${cp.slug}`,
        }),
      ),
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ paddingBottom: 32 }}>
      <Stack.Screen options={{ title: cp.category.name }} />
      <CampaignCover coverKey={cp.coverKey} height={180} />
      <View style={{ padding: 16, gap: 14 }}>
        <View style={styles.row}>
          <CategoryBadge category={cp.category} />
          <PriorityBadge priority={cp.priority} />
          {cp.isOngoing && (
            <AppText size="xs" tone="muted">
              {t('campaign.ongoing')}
            </AppText>
          )}
          {cp.status === 'COMPLETED' && (
            <AppText size="xs" weight="bold" tone="accent">
              {t('campaign.completed')}
            </AppText>
          )}
        </View>
        <AppText display size="xl" testID="campaign-title">
          {cp.title}
        </AppText>
        <AppText>{cp.summary}</AppText>
        {(cp.area || cp.hospitalName) && (
          <View style={{ gap: 2 }}>
            {cp.hospitalName && (
              <AppText size="sm" tone="muted">
                {t('campaign.hospital')}: <AppText size="sm">{cp.hospitalName}</AppText>
              </AppText>
            )}
            {cp.area && (
              <AppText size="sm" tone="muted">
                {cp.area}
              </AppText>
            )}
          </View>
        )}

        <Card testID="campaign-ledger">
          <AppText display size="lg">
            {t('campaign.account')}
          </AppText>
          <FundingBar
            target={ledger.targetAmount}
            verified={ledger.verifiedAmount}
            pending={ledger.pendingAmount}
            demo={ledger.demoAmount}
            legend
          />
          <View>
            <LedgerRow label={t('campaign.target')} value={m(ledger.targetAmount)} k="target" raw={ledger.targetAmount} />
            <LedgerRow label={t('campaign.verified')} value={m(ledger.verifiedAmount)} k="verified" raw={ledger.verifiedAmount} strong />
            <LedgerRow label={t('campaign.pending')} value={m(ledger.pendingAmount)} k="pending" raw={ledger.pendingAmount} />
            <LedgerRow label={t('campaign.demo')} value={m(ledger.demoAmount)} k="demo" raw={ledger.demoAmount} demo />
            <LedgerRow label={t('campaign.spent')} value={m(ledger.spentAmount)} k="spent" raw={ledger.spentAmount} />
            <LedgerRow label={t('campaign.remaining')} value={m(ledger.remainingAmount)} k="remaining" raw={ledger.remainingAmount} total />
          </View>
          <AppText size="xs" tone="muted">
            {t('campaign.accountNote')} {t('campaign.demoNote')}
          </AppText>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText size="xs" tone="muted">
              {t('campaign.beneficiaries', { count: ledger.beneficiariesCount })}
            </AppText>
            <AppText size="xs" tone="muted">
              {t('campaign.donors', { count: ledger.donorsCount })}
            </AppText>
          </View>
          {cp.acceptsPledges ? (
            <Button title={t('campaign.donateNow')} variant="give" onPress={donate} testID="donate-button" />
          ) : (
            <Notice tone="muted">{t('campaign.notAccepting')}</Notice>
          )}
          <Button title={t('campaign.share')} variant="secondary" onPress={share} />
        </Card>

        <Card testID="receiving-accounts">
          <AppText display size="lg">
            {t('campaign.receivingTitle')}
          </AppText>
          <AppText size="xs" tone="muted">
            {t('campaign.receivingNote')}
          </AppText>
          {accounts
            .filter((a) => a.accountNumber)
            .map((a) => (
              <AccountRow key={a.method} account={a} />
            ))}
        </Card>

        <Card testID="beneficiaries">
          <AppText display size="lg">
            {t('campaign.beneficiariesTitle')}
          </AppText>
          <AppText size="xs" tone="muted">
            {t('campaign.beneficiariesNote')}
          </AppText>
          {beneficiaries.length === 0 ? (
            <AppText size="sm" tone="muted">
              {t('campaign.beneficiariesEmpty')}
            </AppText>
          ) : (
            beneficiaries.map((b) => (
              <View
                key={b.code}
                style={[styles.row, { justifyContent: 'space-between', paddingVertical: 4 }]}
                testID={`beneficiary-${b.code}`}
              >
                <View style={{ gap: 0 }}>
                  <AppText size="sm" weight="bold">
                    {b.code}
                  </AppText>
                  <AppText size="xs" tone="muted">
                    {[t(`campaign.kinds.${b.kind}`), b.area].filter(Boolean).join(' — ')}
                  </AppText>
                </View>
                <AppText size="xs" tone="muted">
                  {b.monthlyAmount
                    ? t('campaign.monthly', { amount: money(b.monthlyAmount, ledger.currency, lang) })
                    : t('campaign.since', { date: date(b.since, lang) })}
                </AppText>
              </View>
            ))
          )}
        </Card>

        {cp.updates.length > 0 && (
          <Card>
            <AppText display size="lg">
              {t('campaign.updates')}
            </AppText>
            {cp.updates.map((u) => (
              <View key={u.id} style={{ gap: 2 }}>
                <AppText size="sm">{u.body}</AppText>
                <AppText size="xs" tone="muted">
                  {date(u.createdAt, lang)}
                </AppText>
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function LedgerRow({
  label,
  value,
  k,
  raw,
  strong,
  demo,
  total,
}: {
  label: string;
  value: string;
  /** Test hook: the row key and the raw decimal from the API. */
  k: string;
  raw: string;
  strong?: boolean;
  demo?: boolean;
  total?: boolean;
}) {
  const c = usePalette();
  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: 'space-between',
          paddingVertical: total ? 10 : 7,
          borderTopWidth: 1,
          borderTopColor: c.border,
        },
      ]}
      testID={`ledger-${k}`}
      accessibilityLabel={`${label}: ${value}`}
      {...{ dataSet: { ledger: k, value: raw } }}
    >
      <View style={styles.row}>
        <AppText size="sm" tone={strong || total ? 'ink' : 'muted'} weight={total ? 'bold' : 'regular'}>
          {label}
        </AppText>
        {demo && <DemoBadge />}
      </View>
      <AppText
        size={total ? 'lg' : 'sm'}
        weight={strong || total ? 'bold' : 'regular'}
        tone={total ? 'accent' : demo ? 'muted' : 'ink'}
        display={total}
      >
        {value}
      </AppText>
    </View>
  );
}

function AccountRow({ account }: { account: PaymentAccount }) {
  const { t } = useTranslation();
  const c = usePalette();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(account.accountNumber ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View
      style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10, gap: 4 }}
      testID={`account-${account.method}`}
    >
      <View style={styles.row}>
        <AppText size="sm" weight="bold">
          {account.label}
        </AppText>
        {account.source === 'campaign' && (
          <AppText size="xs" tone="accent">
            {t('campaign.campaignAccount')}
          </AppText>
        )}
        {account.allowsDemoCheckout && <DemoBadge />}
      </View>
      {account.accountName && (
        <AppText size="xs" tone="muted">
          {account.accountName}
        </AppText>
      )}
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <AppText selectable size="base" weight="medium" style={{ writingDirection: 'ltr' }}>
          {account.accountNumber}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('campaign.copyLabel', { method: account.label })}
          onPress={() => void copy()}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <AppText size="xs" weight="bold" tone="accent">
            {copied ? t('campaign.copied') : t('campaign.copy')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
