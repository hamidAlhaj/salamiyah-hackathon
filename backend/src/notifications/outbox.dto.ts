import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OUTBOX_TEMPLATES, type OutboxTemplate } from '../common/shared';

export class ListOutboxQueryDto {
  @ApiPropertyOptional({ enum: OUTBOX_TEMPLATES })
  @IsOptional()
  @IsIn(OUTBOX_TEMPLATES)
  template?: OutboxTemplate;

  @ApiPropertyOptional({ enum: ['QUEUED', 'OPENED'] })
  @IsOptional()
  @IsIn(['QUEUED', 'OPENED'])
  status?: 'QUEUED' | 'OPENED';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class NextOutboxQueryDto {
  @ApiPropertyOptional({ enum: OUTBOX_TEMPLATES })
  @IsOptional()
  @IsIn(OUTBOX_TEMPLATES)
  template?: OutboxTemplate;
}
