import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import sharp from 'sharp';
import type { AllowedUploadMime } from '../common/shared';
import { assertUpload } from './file-validation';

export interface StoredFile {
  storageKey: string;
  mimeType: AllowedUploadMime;
  sizeBytes: number;
  sha256: string;
}

/**
 * تخزين الإيصالات والوثائق. السائق الحالي: Local (مجلد uploads).
 * MinIO (S3-compatible، موجود في docker-compose) هو خيار الإنتاج بنفس الواجهة.
 * لا خدمات سحابية خارجية (CLAUDE.md).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('STORAGE_LOCAL_DIR') ?? 'uploads');
    const driver = config.get<string>('STORAGE_DRIVER') ?? 'local';
    if (driver !== 'local')
      this.logger.warn(`STORAGE_DRIVER=${driver} not implemented yet, using local`);
  }

  /** يتحقق من الملف، يحذف EXIF من الصور بإعادة الترميز، ويخزنه باسم عشوائي. */
  async save(file: Express.Multer.File | undefined, folder: string): Promise<StoredFile> {
    const mime = assertUpload(file);
    const input = (file as Express.Multer.File).buffer;
    let data = input;
    if (mime === 'image/jpeg') {
      // rotate() يطبّق الاتجاه، والإخراج بلا metadata (ومنها الموقع الجغرافي)
      data = await sharp(input).rotate().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    } else if (mime === 'image/png') {
      data = await sharp(input).rotate().png({ compressionLevel: 9 }).toBuffer();
    }
    return this.saveBuffer(data, mime, folder);
  }

  async saveBuffer(
    data: Buffer,
    mimeType: AllowedUploadMime,
    folder: string,
  ): Promise<StoredFile> {
    const ext =
      mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg';
    const storageKey = `${folder}/${randomUUID()}.${ext}`;
    await mkdir(join(this.root, folder), { recursive: true });
    await writeFile(join(this.root, storageKey), data);
    return {
      storageKey,
      mimeType,
      sizeBytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
    };
  }

  /** ملفات الاستيراد (xlsx/csv): تُخزَّن كما هي للمعاينة ثم الحفظ. */
  async saveRaw(data: Buffer, ext: 'xlsx' | 'csv', folder: string): Promise<string> {
    const storageKey = `${folder}/${randomUUID()}.${ext}`;
    await mkdir(join(this.root, folder), { recursive: true });
    await writeFile(join(this.root, storageKey), data);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    const fullPath = resolve(this.root, storageKey);
    if (!fullPath.startsWith(this.root + sep)) throw new NotFoundException();
    try {
      return await readFile(fullPath);
    } catch {
      throw new NotFoundException('file_not_found');
    }
  }
}
