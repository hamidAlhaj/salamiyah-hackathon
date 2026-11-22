import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { COVER_KEYS, toLatinDigits, type CoverKey } from '../common/shared';
import {
  CASE_CATEGORIES,
  CASE_ROUTES,
  CASE_STATUSES,
  CURRENCIES,
  PRIORITIES,
} from '../common/shared';
import type { CaseCategory, CaseRoute, CaseStatus, Currency, Priority } from '@prisma/client';
import {
  AMOUNT_REGEX,
  NormalizeAmount,
  NormalizePhone,
  PHONE_REGEX,
  ToBoolean,
} from '../common/dto/transforms';

/** multipart/form-data: الحقول + ملف `medicalReport`. */
export class CreateCaseDto {
  @ApiProperty({ example: 'محمد ع.' })
  @IsString()
  @Length(3, 120)
  beneficiaryName: string;

  @ApiProperty({ example: '0933123456' })
  @NormalizePhone()
  @Matches(PHONE_REGEX, { message: 'invalid_phone' })
  beneficiaryPhone: string;

  @ApiProperty({ example: '04010123456', description: 'يُخزَّن كـhash فقط' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? toLatinDigits(value).replace(/\s/g, '') : value,
  )
  @Matches(/^\d{6,15}$/, { message: 'invalid_national_id' })
  nationalId: string;

  @ApiProperty({ example: 'المجلس المحلي - الحي الشمالي' })
  @IsString()
  @Length(2, 80)
  localCouncil: string;

  @ApiProperty({ enum: CASE_CATEGORIES })
  @IsIn(CASE_CATEGORIES)
  category: CaseCategory;

  @ApiProperty({ description: 'وصف داخلي كامل (لا يظهر للعامة)' })
  @IsString()
  @Length(10, 4000)
  description: string;

  @ApiProperty({ example: '15000000' })
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  requestedAmount: string;

  @ApiPropertyOptional({ enum: CURRENCIES, default: 'SYP' })
  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'التقرير الطبي (JPEG/PNG/PDF ≤ 5MB)',
  })
  medicalReport?: unknown;
}

export class ListCasesQueryDto {
  @ApiPropertyOptional({ enum: CASE_STATUSES })
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'المتأخرة فقط (تجاوزت SLA)' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  overdue?: boolean;
}

export class ReviewCaseDto {
  @ApiProperty({ enum: ['approve', 'reject', 'needs_info'] })
  @IsIn(['approve', 'reject', 'needs_info'])
  decision: 'approve' | 'reject' | 'needs_info';

  @ApiPropertyOptional({ enum: PRIORITIES })
  @ValidateIf((o: ReviewCaseDto) => o.decision === 'approve')
  @IsIn(PRIORITIES)
  priority?: Priority;

  @ApiPropertyOptional({ enum: CASE_ROUTES })
  @ValidateIf((o: ReviewCaseDto) => o.decision === 'approve')
  @IsIn(CASE_ROUTES)
  route?: CaseRoute;

  @ApiPropertyOptional()
  @ValidateIf((o: ReviewCaseDto) => o.decision === 'approve')
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'د. سامر' })
  @ValidateIf((o: ReviewCaseDto) => o.decision === 'approve')
  @IsString()
  @Length(3, 120)
  doctorName?: string;

  @ApiPropertyOptional({ example: '15000000' })
  @ValidateIf((o: ReviewCaseDto) => o.decision === 'approve')
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  approvedAmount?: string;

  @ApiPropertyOptional({ description: 'إلزامي للرفض وطلب المعلومات' })
  @ValidateIf((o: ReviewCaseDto) => o.decision !== 'approve')
  @IsString()
  @Length(5, 1000)
  reason?: string;
}

/** FR-09: تغيير المشفى أو زيادة المبلغ يعيد الحالة للمراجعة. */
export class ChangeHospitalAmountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: '25000000' })
  @IsOptional()
  @NormalizeAmount()
  @Matches(AMOUNT_REGEX, { message: 'invalid_amount' })
  approvedAmount?: string;

  @ApiProperty({ example: 'المريض طلب التحويل لمشفى خاص' })
  @IsString()
  @Length(5, 1000)
  reason: string;
}

export class PublishCaseDto {
  @ApiProperty({ example: 'عملية قلب عاجلة لرب أسرة' })
  @IsString()
  @Length(5, 160)
  titleAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 160)
  titleEn?: string;

  @ApiProperty({ description: 'الملخص العام بعد إخفاء البيانات الحساسة (إلزامي)' })
  @IsString()
  @Length(20, 2000)
  redactedSummary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(20, 2000)
  summaryEn?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    enum: COVER_KEYS,
    description: 'Bundled illustration (never a photo)',
  })
  @IsOptional()
  @IsIn(COVER_KEYS)
  coverKey?: CoverKey;

  @ApiPropertyOptional({ example: 'السلمية', description: 'A neighbourhood at most' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  area?: string;
}

export class TrackCaseQueryDto {
  @ApiProperty({ example: 'MF-2026-7K3QX' })
  @IsString()
  @Length(6, 30)
  no: string;

  @ApiProperty({ example: '3456', description: 'آخر 4 أرقام من هاتف المستفيد' })
  @Matches(/^\d{4}$/)
  phoneLast4: string;
}
