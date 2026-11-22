import { LIMITS } from '@/shared';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { api } from './api';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** تصوير الإيصال أو اختياره من الصور. */
export async function pickReceipt(source: 'camera' | 'library'): Promise<PickedImage | 'denied' | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return 'denied';
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

/**
 * ضغط على الجهاز قبل الرفع (NFR-02): أطول ضلع ≤ 1600px، JPEG ~60%.
 * إيصال 4MB من الكاميرا يصبح عادة 150–400KB — فرق كبير على إنترنت ضعيف.
 */
export async function compressReceipt(image: PickedImage): Promise<string> {
  const max = LIMITS.receiptMaxDimension;
  const resize = image.width >= image.height ? { width: Math.min(max, image.width) } : { height: Math.min(max, image.height) };
  const rendered = await ImageManipulator.manipulate(image.uri).resize(resize).renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  return saved.uri;
}

export async function uploadReceipt(pledgeId: string, uri: string, transferRef?: string): Promise<void> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('receipt', blob, 'receipt.jpg');
  } else {
    // React Native: كائن {uri, name, type} يُرسل كملف في multipart
    form.append('receipt', { uri, name: 'receipt.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  if (transferRef) form.append('transferRef', transferRef);
  await api(`/pledges/${encodeURIComponent(pledgeId)}/receipts`, { method: 'POST', form });
}
