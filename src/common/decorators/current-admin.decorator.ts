import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminRole } from '../../domains/admin/entities/admin.entity';

export interface CurrentAdminData {
  id: string;
  role: AdminRole;
  type: 'admin';
}

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentAdminData => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== 'admin') {
      throw new Error('Admin context not found');
    }

    return {
      id: user.id,
      role: user.role,
      type: user.type,
    };
  },
);