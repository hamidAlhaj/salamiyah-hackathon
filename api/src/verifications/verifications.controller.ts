import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import { ListVerificationsQueryDto, RejectVerificationDto } from './verifications.dto';
import { VerificationsService } from './verifications.service';

@ApiTags('verifications')
@Roles('FINANCE_VERIFIER')
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة التحقق المالي (الأقدم أولاً)' })
  list(@Query() query: ListVerificationsQueryDto) {
    return this.verifications.list(query);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @ApiOperation({
    summary: 'اعتماد: التعهد VERIFIED + رصيد الحملة + إيصال رسمي (transaction)',
  })
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.verifications.approve(id, user);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'رفض مع سبب إلزامي (يُبلَّغ المتبرع)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectVerificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.verifications.reject(id, dto.reason, user);
  }
}
