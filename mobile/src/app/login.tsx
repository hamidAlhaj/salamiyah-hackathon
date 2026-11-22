import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { LIMITS, normalizePhone } from '@/shared';
import { useLang } from '@/i18n';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { AppText, Button, Card, Notice } from '@/ui/components';
import { fonts, radius, type, usePalette } from '@/ui/theme';

/** Donor login and registration. Staff accounts get a pointer to the web dashboard instead. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = usePalette();
  const { login, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState(false);

  const input = {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.control,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: type.base,
    fontFamily: fonts.body,
    color: c.ink,
  } as const;

  const submit = async () => {
    setError(null);
    if (!normalizePhone(phone)) return setError(t('auth.invalidPhone'));
    if (mode === 'register' && password.length < LIMITS.passwordMinLength) {
      return setError(t('auth.weakPassword'));
    }
    setBusy(true);
    try {
      const me =
        mode === 'login'
          ? await login(phone, password)
          : await register({ fullName: fullName.trim(), phone, password, locale: lang, whatsappOptIn });
      if (me.role !== 'DONOR') {
        // The donor app has no staff screens: sign out again and point to the web dashboard.
        await logout();
        setStaff(true);
        return;
      }
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'phone_taken') setError(t('auth.phoneTaken'));
      else if (e instanceof ApiError && (e.status === 401 || e.status === 400)) setError(t('auth.invalid'));
      else setError(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (staff) {
    return (
      <View style={{ flex: 1, backgroundColor: c.page, padding: 16 }}>
        <Card testID="staff-message">
          <AppText display size="lg">
            {t('auth.staffTitle')}
          </AppText>
          <AppText size="sm" tone="muted">
            {t('auth.staffBody')}
          </AppText>
          <Button title={t('auth.staffOpenWeb')} onPress={() => void Linking.openURL(`${SITE_URL}/login`)} />
          <Button title={t('auth.toLogin')} variant="secondary" onPress={() => setStaff(false)} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.page }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <AppText display size="xl">
          {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
        </AppText>
        <AppText size="sm" tone="muted">
          {t('auth.loginIntro')}
        </AppText>
      </View>
      {mode === 'register' && (
        <Field label={t('auth.fullName')}>
          <TextInput
            style={input}
            value={fullName}
            onChangeText={setFullName}
            accessibilityLabel={t('auth.fullName')}
            autoComplete="name"
            testID="full-name"
          />
        </Field>
      )}
      <Field label={t('auth.phone')}>
        <TextInput
          style={[input, { textAlign: 'left', writingDirection: 'ltr' }]}
          value={phone}
          onChangeText={setPhone}
          accessibilityLabel={t('auth.phone')}
          keyboardType="phone-pad"
          autoComplete="tel"
          testID="phone"
        />
      </Field>
      <Field label={t('auth.password')}>
        <TextInput
          style={[input, { textAlign: 'left', writingDirection: 'ltr' }]}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel={t('auth.password')}
          secureTextEntry
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          testID="password"
        />
      </Field>
      {mode === 'register' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppText size="sm" style={{ flex: 1 }}>
            {t('auth.whatsappOptIn')}
          </AppText>
          <Switch
            value={whatsappOptIn}
            onValueChange={setWhatsappOptIn}
            accessibilityLabel={t('auth.whatsappOptIn')}
            trackColor={{ true: c.accent, false: c.track }}
          />
        </View>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <Button
        title={mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
        onPress={() => void submit()}
        loading={busy}
        disabled={!phone || !password || (mode === 'register' && fullName.trim().length < 3)}
        testID="login-submit"
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setError(null);
          setMode(mode === 'login' ? 'register' : 'login');
        }}
        style={{ padding: 10, alignItems: 'center' }}
      >
        <AppText size="sm" weight="medium" tone="accent">
          {mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}
        </AppText>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText size="sm" weight="medium">
        {label}
      </AppText>
      {children}
    </View>
  );
}
