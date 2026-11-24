import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ListVerificationsQueryDto, RejectVerificationDto } from './verifications.dto';
import { VerificationsService } from './verifications.service';

/** Finance verification queue (FINANCE_VERIFIER). Roles are checked in VerificationsService. */
@ApiTags('verifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة التحقق المالي (الأقدم أولاً)' })
  list(@Query() query: ListVerificationsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.verifications.list(query, user);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @ApiOperation({
    summary: 'اعتماد: التعهد VERIFIED + رصيد الحملة + إيصال رسمي (transaction)',
  })
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.verifications.approve(id, user);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'رفض مع سبب إلزامي (يُبلَّغ المتبرع)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectVerificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verifications.reject(id, dto.reason, user);
  }
}
