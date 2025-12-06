/**
 * JWT Strategy
 *
 * Passport strategy for validating JWT access tokens.
 * Extracts user from token and attaches to request.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../config/config.service';
import { AuthService } from '../domain/auth.service';
import { JwtPayload } from '../domain/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_SECRET') || 'letip-lead-system-jwt-secret-change-in-production',
    });
  }

  /**
   * Validate JWT payload and return user for request
   *
   * Called by Passport after token verification succeeds.
   * The returned object is attached to request.user
   *
   * @param payload - Decoded JWT payload
   * @returns User object to attach to request
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
