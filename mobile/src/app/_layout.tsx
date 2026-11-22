import '@/i18n';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotoKufiArabic_700Bold } from '@expo-google-fonts/noto-kufi-arabic';
import { useFonts } from 'expo-font';
import { Link, Stack, useFocusEffect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { restoreLanguage, setLanguage, useLang } from '@/i18n';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppText } from '@/ui/components';
import { fonts, usePalette } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

function HeaderActions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const lang = useLang();
  const c = usePalette();
  const toggle = async () => {
    const needsRestart = await setLanguage(lang === 'ar' ? 'en' : 'ar');
    if (needsRestart) Alert.alert(t('appName'), t('restartForDirection'));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('languageLabel')}
        testID="language-toggle"
        onPress={() => void toggle()}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <AppText size="sm" weight="medium" style={{ color: c.panelInk }}>
          {t('language')}
        </AppText>
      </Pressable>
      {user && <BellButton />}
      <Link
        href={user ? '/donations' : '/login'}
        testID={user ? 'nav-donations' : 'nav-login'}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <AppText size="sm" weight="bold" style={{ color: c.panelInk }}>
          {user ? t('myDonations') : t('login')}
        </AppText>
      </Link>
    </View>
  );
}

/**
 * The header bell with the unread badge, refreshed whenever the home screen regains focus (after a
 * donation, or coming back from the notifications screen).
 */
function BellButton() {
  const { t } = useTranslation();
  const c = usePalette();
  const [unread, setUnread] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void api<{ unread: number }>('/notifications/unread-count')
        .then((r) => alive && setUnread(r.unread))
        .catch(() => undefined);
      return () => {
        alive = false;
      };
    }, []),
  );
  return (
    <Link
      href="/notifications"
      testID="nav-notifications"
      accessibilityLabel={unread > 0 ? t('notifications.bellUnread', { count: unread }) : t('notifications.bell')}
      style={{ paddingHorizontal: 6, paddingVertical: 6 }}
    >
      <View>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c.panelInk} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </Svg>
        {unread > 0 && (
          <View
            testID="notification-badge"
            style={{
              position: 'absolute',
              top: -6,
              end: -8,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.panelInk,
            }}
          >
            <AppText size="xs" weight="bold" style={{ color: c.panel, fontSize: 12, lineHeight: 16 }}>
              {unread > 9 ? '9+' : String(unread)}
            </AppText>
          </View>
        )}
      </View>
    </Link>
  );
}

function AppStack() {
  const { t } = useTranslation();
  const c = usePalette();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.panel },
        headerTintColor: c.panelInk,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
        contentStyle: { backgroundColor: c.page },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('appName'), headerRight: () => <HeaderActions /> }}
      />
      <Stack.Screen name="campaign/[slug]" options={{ title: '' }} />
      <Stack.Screen name="pledge/[campaignId]" options={{ title: t('pledge.title') }} />
      <Stack.Screen name="receipt/[pledgeId]" options={{ title: t('receipt.title') }} />
      <Stack.Screen name="donations" options={{ title: t('myDonations') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifications.title') }} />
      <Stack.Screen name="login" options={{ title: t('login') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_700Bold,
    NotoKufiArabic_700Bold,
  });
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    void restoreLanguage().finally(() => setLangReady(true));
  }, []);

  // A font that fails to load falls back to the system font rather than blocking the app.
  const ready = (fontsLoaded || fontError !== null) && langReady;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppStack />
    </AuthProvider>
  );
}
