import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  id: number;
  sub: number;
  email: string;
  role: UserRole;
}
