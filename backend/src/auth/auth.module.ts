import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController, AuthMeController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailRegistrationService } from './email-registration.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleAuthService } from './google-auth.service';
import { googleSettings } from './google.config';
import { GoogleStrategy } from './google.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { ProfileService } from './profile.service';

// Global so every protected controller can use JwtAuthGuard without importing AuthModule.
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '8h',
        },
      }),
    }),
  ],
  controllers: [AuthController, AuthMeController],
  providers: [
    AuthService,
    EmailRegistrationService,
    JwtStrategy,
    JwtAuthGuard,
    ProfileService,
    GoogleAuthService,
    GoogleAuthGuard,
    {
      // Sign in with Google is registered only when GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and
      // GOOGLE_CALLBACK_URL are all set; otherwise the Google routes answer 404.
      provide: GoogleStrategy,
      inject: [ConfigService, GoogleAuthService],
      useFactory: (config: ConfigService, google: GoogleAuthService) => {
        const settings = googleSettings(config);
        return settings ? new GoogleStrategy(settings, google) : null;
      },
    },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
