/**
 * JWT Auth Guard
 *
 * Global guard that validates JWT access tokens on all protected routes.
 * Respects @Public() decorator to allow unauthenticated access.
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determine if request can proceed
   *
   * Skips OPTIONS requests (CORS preflight), checks for @Public() decorator, then validates JWT.
   */
  canActivate(context: ExecutionContext) {
    // Skip OPTIONS requests (CORS preflight)
    const request = context.switchToHttp().getRequest();
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Check for @Public() decorator on handler or class
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Handle authentication errors
   *
   * Provides clearer error messages for common JWT issues.
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid access token');
      }
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
