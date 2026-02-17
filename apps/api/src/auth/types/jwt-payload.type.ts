import { Role } from '../../common/enums/role.enum';

export type JwtPayload = {
  userId: string;
  role: Role;
  organizationId: string;
};
