import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import type { TransparencyCategory, TransparencyStats } from '@/shared';
import { useLang } from '@/i18n';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { count, date, money } from '@/lib/format';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { AppText, Button, Card, Notice, styles } from '@/ui/components';
import { fonts, radius, usePalette } from '@/ui/theme';

/**
 * «الشفافية»: the platform's open account from GET /stats/transparency. Four big numbers, the
 * category breakdown and the latest spending. Demo money appears only in its own note.
 */
export default function TransparencyScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const [data, setData] = useState<TransparencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<TransparencyStats>('/stats/transparency', { auth: false, query: { lang } }));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const totals = data?.totals;
  const m = (v: string) => money(v, totals?.currency ?? 'SYP', lang);
  const maxCategory = Math.max(0, ...(data?.categories ?? []).map((x) => Number(x.verifiedAmount)));
  const figures = totals
    ? [
        { key: 'collected', label: t('transparency.collected'), value: m(totals.verifiedAmount) },
        { key: 'spent', label: t('transparency.spent'), value: m(totals.spentAmount) },
        { key: 'remaining', label: t('transparency.remaining'), value: m(totals.remainingAmount) },
        {
          key: 'beneficiaries',
          label: t('transparency.beneficiaries'),
          value: count(data.beneficiaries.total, lang),
        },
      ]
    : [];

  return (
    <ScrollView
      testID="transparency-screen"
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
    >
      {offline && <Notice tone="danger">{t('offline')}</Notice>}

      {totals && data && (
        <>
          <View
            testID="transparency-hero"
            style={{ backgroundColor: c.panel, borderRadius: radius.lg, padding: 20, gap: 16 }}
          >
            <View style={{ gap: 6 }}>
              <AppText display size="xl" style={{ color: c.panelInk }}>
                {t('transparency.heading')}
              </AppText>
              <AppText size="sm" style={{ color: c.panelInk }}>
                {t('transparency.lead')}
              </AppText>
            </View>
            {figures.map((f) => (
              <View
                key={f.key}
                testID={`hero-${f.key}`}
                accessibilityLabel={`${f.label}: ${f.value}`}
                style={{ borderTopWidth: 1, borderTopColor: c.panelInk, paddingTop: 10 }}
              >
                <AppText size="sm" style={{ color: c.panelInk }}>
                  {f.label}
                </AppText>
                <AppText
                  style={{
                    color: c.panelInk,
                    fontFamily: fonts.display,
                    fontSize: 30,
                    lineHeight: 44,
                    // A bare count has no RTL character: keep it on the reading start like the amounts.
                    writingDirection: lang === 'ar' ? 'rtl' : 'ltr',
                  }}
                  testID={`hero-${f.key}-value`}
                >
                  {f.value}
                </AppText>
              </View>
            ))}
            <View style={{ gap: 6 }}>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.min(100, Number(totals.spentPercent)) }}
                style={{ height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: c.panelInk }}
              >
                <View
                  style={{
                    width: `${Math.min(100, Number(totals.spentPercent))}%`,
                    height: '100%',
                    backgroundColor: c.panelInk,
                  }}
                />
              </View>
              <AppText size="sm" style={{ color: c.panelInk }}>
                {t('transparency.spentShare', { percent: totals.spentPercent })}
              </AppText>
              <AppText size="xs" style={{ color: c.panelInk }}>
                {t('transparency.pending', { amount: m(totals.pendingAmount) })}
              </AppText>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <AppText display size="lg">
              {t('transparency.categoriesTitle')}
            </AppText>
            <View style={styles.legend}>
              <Legend color={c.seriesSpent} label={t('transparency.legendSpent')} />
              <Legend color={c.give} label={t('transparency.legendRemaining')} />
            </View>
            {data.categories.map((cat) => (
              <CategoryRow key={cat.code} cat={cat} max={maxCategory} format={m} />
            ))}
          </View>

          <View style={{ gap: 10 }} testID="recent-spending">
            <AppText display size="lg">
              {t('transparency.recentTitle')}
            </AppText>
            {data.recentExpenditures.length === 0 ? (
              <Notice tone="muted">{t('transparency.recentEmpty')}</Notice>
            ) : (
              data.recentExpenditures.map((e) => (
                <Card key={e.id} style={{ gap: 4 }}>
                  <View style={[styles.row, { justifyContent: 'space-between' }]}>
                    <AppText size="sm" weight="bold" style={{ flexShrink: 1 }}>
                      {e.beneficiaryCode ?? e.payeeLabel}
                      <AppText size="sm" tone="muted">{` — ${t(`campaign.payeeTypes.${e.payeeType}`)}`}</AppText>
                    </AppText>
                    <AppText weight="bold">{money(e.amount, e.currency, lang)}</AppText>
                  </View>
                  <AppText size="sm">{e.description}</AppText>
                  <View style={[styles.row, { justifyContent: 'space-between' }]}>
                    <Link href={`/campaign/${e.campaign.slug}`}>
                      <AppText size="xs" tone="accent" weight="bold">
                        {e.campaign.title}
                      </AppText>
                    </Link>
                    <AppText size="xs" tone="muted">
                      {date(e.paidAt, lang)}
                    </AppText>
                  </View>
                </Card>
              ))
            )}
          </View>

          <View
            testID="demo-note"
            style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, borderRadius: radius.sm, padding: 12 }}
          >
            <AppText size="sm" tone="muted">
              {t('transparency.demoNote')}
              {Number(totals.demoAmount) > 0 ? ` ${t('transparency.demoAmount', { amount: m(totals.demoAmount) })}` : ''}
            </AppText>
          </View>

          <Button
            variant="secondary"
            title={t('transparency.openWeb')}
            onPress={() => void Linking.openURL(`${SITE_URL}/transparency`)}
          />
        </>
      )}
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <AppText size="xs" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

/** One category: collected, a spent + remaining bar scaled to the largest category, beneficiaries. */
function CategoryRow({
  cat,
  max,
  format,
}: {
  cat: TransparencyCategory;
  max: number;
  format: (v: string) => string;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const pct = (v: string) => (max > 0 ? Math.min(100, (Number(v) / max) * 100) : 0);
  const spent = pct(cat.spentAmount);
  const remaining = pct(cat.remainingAmount);
  return (
    <Card testID={`category-${cat.code}`} style={{ gap: 8 }}>
      <View style={styles.row}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.accentSoft,
          }}
        >
          <CategoryIcon icon={cat.icon} color={c.accent} size={20} />
        </View>
        <AppText weight="bold" style={{ flex: 1 }}>
          {cat.name}
        </AppText>
        <AppText weight="bold">{format(cat.verifiedAmount)}</AppText>
      </View>
      <View
        accessibilityLabel={`${t('transparency.legendSpent')}: ${format(cat.spentAmount)}`}
        style={{ flexDirection: 'row', height: 12, borderRadius: 2, overflow: 'hidden', backgroundColor: c.surfaceMuted, gap: 2 }}
      >
        {spent > 0 && <View style={{ width: `${spent}%`, backgroundColor: c.seriesSpent }} />}
        {remaining > 0 && (
          <View
            style={{
              width: `${remaining}%`,
              backgroundColor: c.give,
              borderTopEndRadius: 4,
              borderBottomEndRadius: 4,
            }}
          />
        )}
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <AppText size="xs" tone="muted">
          {`${t('transparency.legendSpent')}: ${format(cat.spentAmount)}`}
        </AppText>
        <AppText size="xs" tone="muted">
          {t('transparency.beneficiariesCount', { n: count(cat.beneficiariesCount, lang) })}
        </AppText>
      </View>
    </Card>
  );
}
