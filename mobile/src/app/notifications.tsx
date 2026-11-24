import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, Pressable, RefreshControl, View } from 'react-native';
import type { NotificationView } from '@/shared';
import { useLang } from '@/i18n';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateTime } from '@/lib/format';
import { resolveLink } from '@/lib/links';
import { AppText, Button, Notice } from '@/ui/components';
import { radius, usePalette } from '@/ui/theme';

/**
 * The donor's notifications: receipt confirmations on every donation path, verification results and
 * official receipts. Refreshed whenever the screen gains focus; tapping one marks it read and opens
 * its link (an app screen, or the official receipt page in the browser).
 */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const { user, ready } = useAuth();
  const [items, setItems] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<NotificationView[]>('/notifications'));
    } catch {
      // keep the last list (a 401 already returns to the login screen)
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

  const open = async (n: NotificationView) => {
    if (!n.readAt) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
      );
      void api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => undefined);
    }
    const target = resolveLink(n.link);
    if (target?.kind === 'screen') router.push(target.href as never);
    else if (target?.kind === 'web') await Linking.openURL(target.url);
  };

  const readAll = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now })));
    await api('/notifications/read-all', { method: 'POST' }).catch(() => undefined);
  };

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.page }}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      data={items}
      keyExtractor={(n) => n.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      ListHeaderComponent={
        unread > 0 ? (
          <Button title={t('notifications.markAll')} variant="secondary" onPress={() => void readAll()} />
        ) : undefined
      }
      ListEmptyComponent={!loading ? <Notice tone="muted">{t('notifications.empty')}</Notice> : undefined}
      testID="notification-list"
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => void open(item)}
          testID={`notification-${item.type}`}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderRadius: radius.lg,
            padding: 14,
            gap: 4,
            borderColor: item.readAt ? c.border : c.accent,
            backgroundColor: item.readAt ? c.surface : c.accentSoft,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!item.readAt && (
              <View
                accessibilityLabel={t('notifications.unread')}
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }}
              />
            )}
            <AppText weight="bold" style={{ flex: 1 }}>
              {item.title}
            </AppText>
          </View>
          <AppText size="sm" tone="muted">
            {item.body}
          </AppText>
          <AppText size="xs" tone="muted">
            {dateTime(item.createdAt, lang)}
          </AppText>
        </Pressable>
      )}
    />
  );
}
