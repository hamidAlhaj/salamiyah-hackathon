import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LIMITS } from '../common/shared';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ChangeHospitalAmountDto,
  CreateCaseDto,
  ListCasesQueryDto,
  PublishCaseDto,
  ReviewCaseDto,
  TrackCaseQueryDto,
} from './cases.dto';
import { CasesService } from './cases.service';

/** Public case tracking. Registered before CasesController so `cases/track` is not taken by `cases/:id`. */
@ApiTags('cases')
@Controller()
export class PublicCasesController {
  constructor(private readonly cases: CasesService) {}

  @Get('cases/track')
  @ApiOperation({ summary: 'تتبع الطلب برقم التتبع + آخر 4 أرقام من الهاتف (FR-12)' })
  track(@Query() query: TrackCaseQueryDto) {
    return this.cases.track(query.no, query.phoneLast4);
  }
}

/** Staff case workflow. Roles are checked in CasesService. */
@ApiTags('cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post('cases')
  @UseInterceptors(
    FileInterceptor('medicalReport', { limits: { fileSize: LIMITS.maxUploadBytes } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCaseDto })
  @ApiOperation({ summary: 'تسجيل طلب حالة طبية + التقرير الطبي (FR-06)' })
  create(
    @Body() dto: CreateCaseDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cases.create(dto, file, user);
  }

  @Get('cases')
  @ApiOperation({ summary: 'قائمة الحالات (فلترة بالحالة/الأولوية/المتأخرة)' })
  list(@Query() query: ListCasesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.cases.list(query, user);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'تفاصيل الحالة + تاريخ المستفيد' })
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cases.get(id, user);
  }

  @Post('cases/:id/review')
  @ApiOperation({ summary: 'اعتماد / رفض / طلب معلومات (FR-07)' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cases.review(id, dto, user);
  }

  @Patch('cases/:id/hospital-amount')
  @ApiOperation({
    summary: 'تغيير المشفى/المبلغ — يعيد الحالة للمراجعة ويوقف التعهدات (FR-09)',
  })
  changeHospitalOrAmount(
    @Param('id') id: string,
    @Body() dto: ChangeHospitalAmountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cases.changeHospitalOrAmount(id, dto, user);
  }

  @Post('cases/:id/publish')
  @ApiOperation({ summary: 'نشر الحالة كحملة عامة (FR-08)' })
  publish(
    @Param('id') id: string,
    @Body() dto: PublishCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cases.publish(id, dto, user);
  }

  @Get('documents/:id/file')
  @ApiOperation({ summary: 'تنزيل وثيقة خاصة (للموظفين فقط)' })
  async documentFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const file = await this.cases.documentFile(id, user);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }
}
