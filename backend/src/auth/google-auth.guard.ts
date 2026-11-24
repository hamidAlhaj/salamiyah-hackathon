import {
  BadRequestException,
  type ExecutionContext,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, type IAuthModuleOptions } from '@nestjs/passport';
import type { Request } from 'express';
import { GOOGLE_STATE_REGEX, googleSettings } from './google.config';

/**
 * Runs the "google" strategy. 404 `google_sign_in_disabled` when the GOOGLE_* keys are not set (the
 * strategy is not even registered then). Without `code` the strategy answers with the redirect to
 * Google, which needs the web's CSRF `state`; with `code` it exchanges the code for the profile.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!googleSettings(this.config)) throw new NotFoundException('google_sign_in_disabled');
    const req = context.switchToHttp().getRequest<Request>();
    if (!isNonEmptyString(req.query.code) && !validState(req.query.state)) {
      throw new BadRequestException('google_state_required');
    }
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const req = context.switchToHttp().getRequest<Request>();
    return {
      session: false,
      prompt: 'select_account',
      state: validState(req.query.state) ? req.query.state : undefined,
    };
  }

  /** Our own refusals (staff account, mismatch) pass through; any other failure is one stable code. */
  handleRequest<TUser>(err: unknown, user: TUser | false | undefined): TUser {
    if (err instanceof HttpException) throw err;
    if (err || !user) throw new UnauthorizedException('google_sign_in_failed');
    return user;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function validState(value: unknown): value is string {
  return typeof value === 'string' && GOOGLE_STATE_REGEX.test(value);
}
