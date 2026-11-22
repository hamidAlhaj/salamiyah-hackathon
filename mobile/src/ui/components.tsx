import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Priority, PublicCampaignCategory } from '@/shared';
import { fundingSegments } from '@/lib/funding';
import { CategoryIcon } from './CategoryIcon';
import { fonts, radius, type, usePalette } from './theme';

type Tone = 'ink' | 'muted' | 'accent' | 'danger' | 'warning';
type Size = keyof typeof type;

/** Body text in IBM Plex Sans Arabic; `display` switches to Noto Kufi Arabic for headings. */
export function AppText({
  tone = 'ink',
  size = 'base',
  weight = 'regular',
  display = false,
  style,
  ...rest
}: TextProps & {
  tone?: Tone;
  size?: Size;
  weight?: 'regular' | 'medium' | 'bold';
  display?: boolean;
}) {
  const c = usePalette();
  const color = { ink: c.ink, muted: c.muted, accent: c.accent, danger: c.danger, warning: c.warning }[
    tone
  ];
  const fontFamily = display
    ? fonts.display
    : weight === 'bold'
      ? fonts.bodyBold
      : weight === 'medium'
        ? fonts.bodyMedium
        : fonts.body;
  const fontSize = type[size];
  return (
    <Text
      style={[{ color, fontFamily, fontSize, lineHeight: Math.round(fontSize * (display ? 1.5 : 1.7)) }, style]}
      {...rest}
    />
  );
}

export function Card({ style, ...rest }: ViewProps) {
  const c = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * primary = brand green; give = saffron, only for donate actions; secondary = outlined.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'give' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const bg = variant === 'primary' ? c.accent : variant === 'give' ? c.give : 'transparent';
  const fg = variant === 'primary' ? c.surface : variant === 'give' ? c.giveInk : c.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: c.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <AppText weight="bold" style={{ color: fg }}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

/** A filter chip (category or priority). */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  testID?: string;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: c.accent, borderColor: c.accent }
          : { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      {icon && <CategoryIcon icon={icon} color={selected ? c.surface : c.accent} size={17} />}
      <AppText size="sm" weight="medium" style={{ color: selected ? c.surface : c.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function CategoryBadge({ category }: { category: PublicCampaignCategory }) {
  const c = usePalette();
  return (
    <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
      <CategoryIcon icon={category.icon} color={c.accent} size={15} />
      <AppText size="xs" weight="medium" tone="accent">
        {category.name}
      </AppText>
    </View>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  const c = usePalette();
  if (priority === 'NORMAL') return null;
  const urgent = priority === 'VERY_URGENT';
  return (
    <View
      style={[styles.badge, { backgroundColor: urgent ? c.dangerSoft : c.warningSoft }]}
    >
      <AppText size="xs" weight="bold" tone={urgent ? 'danger' : 'warning'}>
        {t(`priority.${priority}`)}
      </AppText>
    </View>
  );
}

export function DemoBadge() {
  const { t } = useTranslation();
  const c = usePalette();
  return (
    <View style={[styles.badge, { borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' }]}>
      <AppText size="xs" weight="bold" tone="muted">
        {t('campaign.demoBadge')}
      </AppText>
    </View>
  );
}

/**
 * Funding progress in three segments like the web FundingBar: verified (solid saffron), received but
 * pending verification (light), simulated «Demo» (grey, never counted as verified). The percentage is
 * the verified share only.
 */
export function FundingBar({
  target,
  verified,
  pending,
  demo,
  legend = false,
  testID,
}: {
  target: string;
  verified: string;
  pending: string;
  demo: string;
  legend?: boolean;
  testID?: string;
}) {
  const { t } = useTranslation();
  const c = usePalette();
  const s = fundingSegments({ target, verified, pending, demo });
  return (
    <View testID={testID} style={{ gap: 8 }}>
      <View style={styles.barRow}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('campaign.progressLabel')}
          accessibilityValue={{ min: 0, max: 100, now: Math.min(100, s.verifiedPercent) }}
          style={[styles.track, { backgroundColor: c.track }]}
        >
          <View style={{ width: `${s.verified}%`, backgroundColor: c.give }} />
          <View style={{ width: `${s.pending}%`, backgroundColor: c.givePending }} />
          <View style={{ width: `${s.demo}%`, backgroundColor: c.demo }} />
        </View>
        <AppText size="sm" weight="bold" style={{ minWidth: 44 }}>
          {`${s.verifiedPercent}%`}
        </AppText>
      </View>
      {legend && (
        <View style={styles.legend}>
          <LegendDot color={c.give} label={t('campaign.verified')} />
          <LegendDot color={c.givePending} label={t('campaign.pending')} />
          <LegendDot color={c.demo} label={t('campaign.demo')} />
        </View>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText size="xs" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export function Notice({ tone, children }: { tone: 'danger' | 'success' | 'muted'; children: ReactNode }) {
  const c = usePalette();
  const bg = tone === 'danger' ? c.dangerSoft : tone === 'success' ? c.accentSoft : c.surfaceMuted;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: bg }]}>
      <AppText size="sm" tone={tone === 'danger' ? 'danger' : tone === 'success' ? 'accent' : 'muted'}>
        {children}
      </AppText>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 10 },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  notice: { padding: 12, borderRadius: radius.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
