import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput } from 'react-native';
import { ApiError } from '@/lib/api';
import { compressReceipt, type PickedImage, pickReceipt, uploadReceipt } from '@/lib/receipt';
import { AppText, Button, Notice } from '@/ui/components';
import { fonts, radius, type, usePalette } from '@/ui/theme';

/** Receipt upload kept as it was: camera or gallery → compressed on the phone → upload. */
export default function ReceiptScreen() {
  const { pledgeId } = useLocalSearchParams<{ pledgeId: string }>();
  const { t } = useTranslation();
  const c = usePalette();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    const result = await pickReceipt(source);
    if (result === 'denied') setError(t('receipt.permission'));
    else if (result) setImage(result);
  };

  const upload = async () => {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const uri = await compressReceipt(image);
      await uploadReceipt(pledgeId, uri, transferRef.trim() || undefined);
      setDone(true);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'generic';
      setError(t(`errors.${code}`, { defaultValue: t('errors.generic') }));
    } finally {
      setBusy(false);
    }
  };

  const screen = { flex: 1, backgroundColor: c.page } as const;
  const content = { padding: 16, gap: 12 } as const;

  if (done) {
    return (
      <ScrollView style={screen} contentContainerStyle={content}>
        <Notice tone="success">{t('receipt.done')}</Notice>
        <Button title={t('myDonations')} onPress={() => router.replace('/donations')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={screen} contentContainerStyle={content}>
      <Button title={t('receipt.camera')} onPress={() => void pick('camera')} />
      <Button title={t('receipt.gallery')} variant="secondary" onPress={() => void pick('library')} />
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: '100%', aspectRatio: image.width / image.height, borderRadius: radius.md }}
          contentFit="contain"
        />
      )}
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
        }}
        value={transferRef}
        onChangeText={setTransferRef}
        placeholder={t('receipt.transferRef')}
        placeholderTextColor={c.muted}
        accessibilityLabel={t('receipt.transferRef')}
        autoCapitalize="characters"
      />
      {error && <Notice tone="danger">{error}</Notice>}
      {busy && (
        <AppText size="sm" tone="muted">
          {t('receipt.uploading')}
        </AppText>
      )}
      <Button title={t('receipt.upload')} onPress={() => void upload()} loading={busy} disabled={!image} />
    </ScrollView>
  );
}
