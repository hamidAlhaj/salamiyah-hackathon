import '@/i18n';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { NotoKufiArabic_700Bold } from '@expo-google-fonts/noto-kufi-arabic';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { restoreLanguage, setLanguage, useLang } from '@/i18n';
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
