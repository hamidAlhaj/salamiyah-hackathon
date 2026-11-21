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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LIMITS } from '../common/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Authenticated, Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import {
  ChangeHospitalAmountDto,
  CreateCaseDto,
  ListCasesQueryDto,
  PublishCaseDto,
  ReviewCaseDto,
  TrackCaseQueryDto,
} from './cases.dto';
import { CasesService } from './cases.service';

@ApiTags('cases')
@Controller()
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Roles('STAFF', 'ADMIN')
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
    @CurrentUser() user: AuthUser,
  ) {
    return this.cases.create(dto, file, user);
  }

  @Public()
  @Get('cases/track')
  @ApiOperation({ summary: 'تتبع الطلب برقم التتبع + آخر 4 أرقام من الهاتف (FR-12)' })
  track(@Query() query: TrackCaseQueryDto) {
    return this.cases.track(query.no, query.phoneLast4);
  }

  @Roles('STAFF', 'CASE_OFFICER', 'ADMIN')
  @Get('cases')
  @ApiOperation({ summary: 'قائمة الحالات (فلترة بالحالة/الأولوية/المتأخرة)' })
  list(@Query() query: ListCasesQueryDto) {
    return this.cases.list(query);
  }

  @Roles('STAFF', 'CASE_OFFICER', 'ADMIN')
  @Get('cases/:id')
  @ApiOperation({ summary: 'تفاصيل الحالة + تاريخ المستفيد' })
  get(@Param('id') id: string) {
    return this.cases.get(id);
  }

  @Roles('CASE_OFFICER')
  @Post('cases/:id/review')
  @ApiOperation({ summary: 'اعتماد / رفض / طلب معلومات (FR-07)' })
  review(@Param('id') id: string, @Body() dto: ReviewCaseDto, @CurrentUser() user: AuthUser) {
    return this.cases.review(id, dto, user);
  }

  @Roles('CASE_OFFICER', 'ADMIN')
  @Patch('cases/:id/hospital-amount')
  @ApiOperation({
    summary: 'تغيير المشفى/المبلغ — يعيد الحالة للمراجعة ويوقف التعهدات (FR-09)',
  })
  changeHospitalOrAmount(
    @Param('id') id: string,
    @Body() dto: ChangeHospitalAmountDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cases.changeHospitalOrAmount(id, dto, user);
  }

  @Roles('CASE_OFFICER')
  @Post('cases/:id/publish')
  @ApiOperation({ summary: 'نشر الحالة كحملة عامة (FR-08)' })
  publish(
    @Param('id') id: string,
    @Body() dto: PublishCaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cases.publish(id, dto, user);
  }

  @Authenticated()
  @Get('documents/:id/file')
  @ApiOperation({ summary: 'تنزيل وثيقة خاصة (للموظفين فقط)' })
  async documentFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<StreamableFile> {
    const file = await this.cases.documentFile(id, user);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }
}
