export type AdminUserPosition = {
  id: number;
  deptId: number;
  deptName: string;
  deptPath: string;
  code: string;
  name: string;
  status: 'enabled' | 'disabled';
  primary: boolean;
  roleIds: number[];
  roleNames: string[];
};

export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  preferences: Record<string, unknown>;
  status: 'enabled' | 'disabled';
  primaryDeptId?: number | null;
  primaryDeptName: string;
  primaryDeptPath: string;
  deptIds: number[];
  positions: AdminUserPosition[];
  positionIds: number[];
  roles: string[];
  roleNames: string[];
  roleIds: number[];
  directRoles: string[];
  directRoleNames: string[];
  directRoleIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUserCreatePayload = {
  username: string;
  password: string;
  nickname?: string;
  status: AdminUser['status'];
  deptIds?: number[];
  primaryDeptId?: number | null;
  positionIds?: number[];
  roleIds?: number[];
};

export type AdminUserUpdatePayload = Partial<AdminUserCreatePayload>;
