import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { PRIORITIES, type Paginated, type Priority, type PublicCampaign, type PublicCategory } from '@/shared';
import { useLang } from '@/i18n';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { CampaignCover } from '@/ui/CampaignCover';
import {
  AppText,
  Button,
  CategoryBadge,
  Chip,
  FundingBar,
  Notice,
  PriorityBadge,
  styles,
} from '@/ui/components';
import { radius, usePalette } from '@/ui/theme';

/**
 * Campaigns of every category. The category chips come from GET /categories (data, not code), so a
 * category the council adds on the web appears here without an app update. The last loaded list stays
 * on screen when the connection drops.
 */
export default function CampaignsScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [items, setItems] = useState<PublicCampaign[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [priority, setPriority] = useState<Priority | undefined>();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, page] = await Promise.all([
        api<PublicCategory[]>('/categories', { auth: false, query: { lang } }),
        api<Paginated<PublicCampaign>>('/campaigns', {
          auth: false,
          query: { lang, category, priority, pageSize: '50' },
        }),
      ]);
      setCategories(cats);
      setItems(page.items);
      setOffline(false);
      // A category deactivated on the web disappears from the chips: fall back to "All".
      if (category && !cats.some((x) => x.code === category)) setCategory(undefined);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [lang, category, priority]);

  // Refresh when the screen regains focus (after a donation) and when a filter changes.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const header = (
    <View style={{ gap: 14, paddingBottom: 4 }}>
      <View style={{ gap: 4 }}>
        <AppText display size="xl">
          {t('browse.title')}
        </AppText>
        <AppText size="sm" tone="muted">
          {t('browse.intro')}
        </AppText>
      </View>
      {/* A donation without a specific campaign (docs/fund-contract.md). */}
      <Button
        title={t('fund.cta')}
        variant="give"
        testID="home-fund-cta"
        onPress={() => router.push('/campaign/general-fund')}
      />
      {offline && <Notice tone="danger">{t('offline')}</Notice>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('browse.categoriesLabel')}
        contentContainerStyle={{ gap: 8 }}
        testID="category-chips"
      >
        <Chip
          label={t('browse.all')}
          selected={category === undefined}
          onPress={() => setCategory(undefined)}
          testID="category-ALL"
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            icon={cat.icon}
            selected={category === cat.code}
            onPress={() => setCategory(cat.code)}
            testID={`category-${cat.code}`}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('browse.priorityLabel')}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip
          label={t('browse.priorityAll')}
          selected={priority === undefined}
          onPress={() => setPriority(undefined)}
          testID="priority-ALL"
        />
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={t(`priority.${p}`)}
            selected={priority === p}
            onPress={() => setPriority(p)}
            testID={`priority-${p}`}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.page }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      data={items}
      keyExtractor={(x) => x.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        !loading ? (
          <View style={{ gap: 10 }}>
            <Notice tone="muted">{t('browse.empty')}</Notice>
            {(category || priority) && (
              <Button
                title={t('browse.showAll')}
                variant="secondary"
                onPress={() => {
                  setCategory(undefined);
                  setPriority(undefined);
                }}
              />
            )}
          </View>
        ) : undefined
      }
      renderItem={({ item }) => <CampaignCard campaign={item} />}
      testID="campaign-list"
    />
  );
}

function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  return (
    <Link href={`/campaign/${campaign.slug}`} asChild>
      <Pressable
        accessibilityRole="link"
        testID={`campaign-card-${campaign.slug}`}
        style={({ pressed }) => [
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: radius.lg,
            overflow: 'hidden',
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <CampaignCover coverKey={campaign.coverKey} height={132} />
        <View style={{ padding: 16, gap: 10 }}>
          <View style={styles.row}>
            <CategoryBadge category={campaign.category} />
            <PriorityBadge priority={campaign.priority} />
          </View>
          <AppText size="lg" weight="bold">
            {campaign.title}
          </AppText>
          <AppText size="sm" tone="muted" numberOfLines={2}>
            {campaign.summary}
          </AppText>
          <FundingBar
            target={campaign.targetAmount}
            verified={campaign.verifiedAmount}
            pending={campaign.pendingAmount}
            demo={campaign.demoAmount}
          />
          <AppText size="sm">
            <AppText size="sm" weight="bold">
              {money(campaign.verifiedAmount, campaign.currency, lang)}
            </AppText>
            <AppText size="sm" tone="muted">
              {' '}
              {t('campaign.ofTarget', { target: money(campaign.targetAmount, campaign.currency, lang) })}
            </AppText>
          </AppText>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText size="xs" tone="muted" testID="beneficiaries-count">
              {t('campaign.beneficiaries', { count: campaign.beneficiariesCount })}
            </AppText>
            <AppText size="xs" tone="muted">
              {t('campaign.donors', { count: campaign.donorsCount })}
            </AppText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
