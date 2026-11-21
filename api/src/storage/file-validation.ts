import { BadRequestException } from '@nestjs/common';
import { type AllowedUploadMime, LIMITS } from '../common/shared';

/** يحدد نوع الملف من محتواه (magic bytes) لا من الامتداد (NFR-05). */
export function detectMime(buffer: Buffer): AllowedUploadMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-')
    return 'application/pdf';
  return null;
}

/** يرفض الملفات المفقودة أو الكبيرة أو غير المدعومة، ويرجع النوع الحقيقي. */
export function assertUpload(file: Express.Multer.File | undefined): AllowedUploadMime {
  if (!file) throw new BadRequestException('file_required');
  if (file.size > LIMITS.maxUploadBytes) throw new BadRequestException('file_too_large');
  const mime = detectMime(file.buffer);
  if (!mime) throw new BadRequestException('unsupported_file_type');
  return mime;
}
