import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

export const OrganizationId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload; organizationId?: string }>();
  const organizationId = request.organizationId ?? request.user?.organizationId;

  if (!organizationId) {
    throw new UnauthorizedException('Missing organization context');
  }

  return organizationId;
});
