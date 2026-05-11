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
  roles: string[];
  roleNames: string[];
  roleIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUserCreatePayload = {
  username: string;
  password: string;
  nickname?: string;
  status: AdminUser['status'];
  roleIds?: number[];
  deptIds?: number[];
  primaryDeptId?: number | null;
};

export type AdminUserUpdatePayload = Partial<AdminUserCreatePayload>;
