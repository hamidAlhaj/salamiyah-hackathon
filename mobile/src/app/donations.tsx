import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, RefreshControl, View } from 'react-native';
import type { PledgeStatus, PledgeView } from '@/shared';
import { useLang } from '@/i18n';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { date, money } from '@/lib/format';
import { AppText, Button, Card, DemoBadge, Notice, styles } from '@/ui/components';
import { usePalette } from '@/ui/theme';

const TONE: Record<PledgeStatus, 'warning' | 'accent' | 'danger' | 'muted'> = {
  PLEDGED: 'warning',
  RECEIPT_UPLOADED: 'warning',
  COLLECTED: 'warning',
  VERIFIED: 'accent',
  DEMO_CONFIRMED: 'muted',
  REJECTED: 'danger',
  CANCELLED: 'muted',
};

/** «تبرعاتي»: every pledge with its status, the receipt upload step and the official receipt link. */
export default function DonationsScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const { user, ready, logout } = useAuth();
  const [items, setItems] = useState<PledgeView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<PledgeView[]>('/pledges/mine'));
    } catch {
      // keep the last loaded list (a 401 already sends the donor to the login screen)
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) void load();
    }, [user, load]),
  );

  if (ready && !user) return <Redirect href="/login" />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.page }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={items}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      ListHeaderComponent={
        user ? (
          <AppText size="sm" tone="muted">
            {user.fullName}
          </AppText>
        ) : undefined
      }
      ListEmptyComponent={!loading ? <Notice tone="muted">{t('donations.empty')}</Notice> : undefined}
      ListFooterComponent={
        <Button
          title={t('logout')}
          variant="secondary"
          onPress={() => void logout().then(() => router.replace('/'))}
        />
      }
      renderItem={({ item }) => (
        <Card testID={`pledge-${item.referenceNo}`}>
          <AppText weight="bold">{item.campaignTitle}</AppText>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText weight="bold">{money(item.amount, item.currency, lang)}</AppText>
            <View style={styles.row}>
              <AppText size="sm" weight="bold" tone={TONE[item.status]}>
                {t(`status.${item.status === 'PLEDGED' && item.method === 'CASH' ? 'PLEDGED_CASH' : item.status}`)}
              </AppText>
              {item.isDemo && <DemoBadge />}
            </View>
          </View>
          <AppText size="xs" tone="muted">
            {`${item.referenceNo} — ${date(item.createdAt, lang)}`}
          </AppText>
          {item.collectionPoint && (
            <AppText size="xs" tone="muted">
              {t('donations.point', { name: item.collectionPoint.name, area: item.collectionPoint.area })}
            </AppText>
          )}
          {item.rejectionReason && (
            <Notice tone="danger">{t('donations.rejection', { reason: item.rejectionReason })}</Notice>
          )}
          {(item.status === 'PLEDGED' || item.status === 'REJECTED') && !item.isDemo && item.method !== 'CASH' && (
            <Button title={t('pledge.uploadNow')} onPress={() => router.push(`/receipt/${item.id}`)} />
          )}
          {item.officialReceiptNo && item.status === 'VERIFIED' && !item.isDemo && (
            <View style={{ gap: 6 }} testID={`official-${item.officialReceiptNo}`}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <AppText size="sm" tone="muted">
                  {t('donations.receiptNo')}
                </AppText>
                <AppText weight="bold" style={{ writingDirection: 'ltr' }}>
                  {item.officialReceiptNo}
                </AppText>
              </View>
              {/* The public receipt page (with its QR code) opens in the browser. */}
              <Button
                title={t('donations.official')}
                variant="secondary"
                onPress={() =>
                  void Linking.openURL(
                    `${SITE_URL}/receipts/${encodeURIComponent(item.officialReceiptNo ?? '')}`,
                  )
                }
              />
            </View>
          )}
        </Card>
      )}
    />
  );
}
