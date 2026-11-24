import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { VERIFICATION_STATUSES } from '../common/shared';
import type { VerificationStatus } from '@prisma/client';

export class ListVerificationsQueryDto {
  @ApiPropertyOptional({ enum: VERIFICATION_STATUSES, default: 'PENDING' })
  @IsOptional()
  @IsIn(VERIFICATION_STATUSES)
  status: VerificationStatus = 'PENDING';
}

export class RejectVerificationDto {
  @ApiProperty({ example: 'المبلغ في الإيصال لا يطابق التعهد' })
  @IsString()
  @Length(5, 500)
  reason: string;
}
