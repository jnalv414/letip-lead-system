/**
 * Roles Decorator
 *
 * Specifies which roles can access an endpoint.
 * Used with RolesGuard to enforce role-based access control.
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator
 *
 * Apply to controller methods to restrict access by role
 *
 * @param roles - Roles that can access this endpoint
 *
 * @example
 * @Roles(Role.ADMIN)
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 *
 * @example
 * @Roles(Role.ADMIN, Role.MEMBER)
 * @Post()
 * create(@Body() dto: CreateDto) { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
