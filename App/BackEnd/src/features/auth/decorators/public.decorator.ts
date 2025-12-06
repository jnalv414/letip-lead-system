/**
 * Public Decorator
 *
 * Marks an endpoint as publicly accessible (no authentication required).
 * Used with JwtAuthGuard to bypass authentication for specific routes.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator
 *
 * Apply to controller methods to make them publicly accessible
 *
 * @example
 * @Public()
 * @Get('health')
 * health() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
