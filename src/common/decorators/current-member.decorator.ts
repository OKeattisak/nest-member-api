import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentMemberData {
  id: string;
  type: 'member';
}

export const CurrentMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentMemberData => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== 'member') {
      throw new Error('Member context not found');
    }

    return {
      id: user.id,
      type: user.type,
    };
  },
);