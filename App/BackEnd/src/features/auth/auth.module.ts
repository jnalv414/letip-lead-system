/**
 * Auth Module
 *
 * Provides authentication and authorization for the application.
 *
 * Features:
 * - JWT-based authentication
 * - Role-based access control (RBAC)
 * - Session management with refresh tokens
 * - HTTP-only cookie security
 *
 * Exports:
 * - AuthService for user validation
 * - TokenService for token operations
 * - Guards for use in other modules
 */

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Domain services
import { PasswordService } from './domain/password.service';
import { TokenService } from './domain/token.service';
import { SessionService } from './domain/session.service';
import { AuthService } from './domain/auth.service';

// API
import { AuthController } from './api/auth.controller';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Core modules
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '../../config/config.module';

@Global() // Make auth services available globally
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'letip-lead-system-jwt-secret-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Domain services
    PasswordService,
    TokenService,
    SessionService,
    AuthService,

    // Passport strategy
    JwtStrategy,

    // Guards (provided but not used globally here - use APP_GUARD in app.module)
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    // Export for use in other modules
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
