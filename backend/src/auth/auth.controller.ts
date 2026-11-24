import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthResponse } from '../common/shared';
import {
  AuthResponseDto,
  CompleteEmailRegistrationDto,
  GoogleSignInConfigDto,
  LoginDto,
  MeResponse,
  RegisterDto,
  StartEmailRegistrationDto,
  UpdatePhoneDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { EmailRegistrationService } from './email-registration.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { googlePublicConfig } from './google.config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ProfileService } from './profile.service';

/** Public: register and login (phone + password), and the optional Google sign-in. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly emailRegistration: EmailRegistrationService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new donor (DONOR)' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: 'phone_taken' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in with a phone number or donor email, and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'invalid_credentials' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('email-registration/enabled')
  @ApiOperation({ summary: 'Whether email registration can send verification links' })
  emailRegistrationEnabled() {
    return { enabled: this.emailRegistration.enabled() };
  }

  @Post('email-registration/start')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a donor registration link by email' })
  startEmailRegistration(@Body() dto: StartEmailRegistrationDto) {
    return this.emailRegistration.start(dto);
  }

  @Post('email-registration/complete')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verify the link, set a password, and create a donor session' })
  completeEmailRegistration(@Body() dto: CompleteEmailRegistrationDto) {
    return this.emailRegistration.complete(dto);
  }

  @Get('google/enabled')
  @ApiOperation({
    summary: 'Whether Sign in with Google is configured (the web hides the button)',
  })
  @ApiOkResponse({ type: GoogleSignInConfigDto })
  googleEnabled() {
    return googlePublicConfig(this.config);
  }

  /**
   * Called server-side by the web route /auth/google/start, which reads the redirect's Location
   * and sends the browser there. `state` is the web's CSRF value (kept in its HttpOnly cookie).
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Redirect (302) to the Google consent screen' })
  @ApiQuery({ name: 'state', description: 'CSRF state from the web (32–128 URL-safe chars)' })
  @ApiFoundResponse({ description: 'Location: accounts.google.com' })
  @ApiBadRequestResponse({ description: 'google_state_required' })
  @ApiNotFoundResponse({ description: 'google_sign_in_disabled' })
  googleStart(): void {
    // The guard answers with the redirect; this handler never runs.
  }

  /**
   * Called server-side by the web route /auth/google/callback (after it checked `state`) with
   * Google's one-time code. Returns the same session as POST /auth/login.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange Google's one-time code for the app session" })
  @ApiQuery({ name: 'code', description: "Google's authorization code" })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'google_sign_in_failed / invalid_credentials' })
  @ApiForbiddenResponse({ description: 'google_staff_account' })
  @ApiConflictResponse({ description: 'google_account_mismatch' })
  @ApiNotFoundResponse({ description: 'google_sign_in_disabled' })
  googleCallback(@Req() req: { user: AuthResponse }): AuthResponse {
    return req.user;
  }
}

/** Protected: the current user and their profile. */
@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthMeController {
  constructor(
    private readonly auth: AuthService,
    private readonly profile: ProfileService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user' })
  @ApiOkResponse({ type: MeResponse })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }

  @Patch('me/phone')
  @ApiOperation({ summary: 'DONOR: add or change my phone (required before donating)' })
  @ApiOkResponse({ type: MeResponse })
  @ApiConflictResponse({ description: 'phone_taken' })
  @ApiForbiddenResponse({ description: 'role_not_allowed' })
  updatePhone(@Body() dto: UpdatePhoneDto, @CurrentUser() user: AuthenticatedUser) {
    return this.profile.updatePhone(dto, user);
  }
}
