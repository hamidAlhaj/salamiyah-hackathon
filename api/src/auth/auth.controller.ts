import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Authenticated } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types';
import { LoginDto, MeResponse, RegisterDto, TokensResponse } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'تسجيل متبرع جديد (DONOR)' })
  @ApiOkResponse({ type: TokensResponse })
  @ApiConflictResponse({ description: 'phone_taken' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'تسجيل الدخول بالهاتف وكلمة المرور' })
  @ApiOkResponse({ type: TokensResponse })
  @ApiUnauthorizedResponse({ description: 'invalid_credentials' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Authenticated()
  @Get('me')
  @ApiOperation({ summary: 'المستخدم الحالي' })
  @ApiOkResponse({ type: MeResponse })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
