/**
 * CurrentUser Decorator
 *
 * Extracts the authenticated user from the request object.
 * The user is attached by JwtAuthGuard after token validation.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * User payload attached to request by JWT strategy
 */
export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * @CurrentUser() decorator
 *
 * Extracts authenticated user from request
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return user;
 * }
 *
 * @example
 * // Get specific field
 * @Get('me')
 * getMe(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
