export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  status: 'enabled' | 'disabled';
  primaryDeptId?: number | null;
  deptIds: number[];
  roles: string[];
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
