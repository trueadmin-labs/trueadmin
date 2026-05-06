export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  status: 'enabled' | 'disabled' | string;
  primaryDeptId?: number | null;
  deptIds?: number[];
  deptId?: number | null;
  roles: string[];
  roleIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayload = {
  username: string;
  nickname?: string;
  password?: string;
  status?: string;
  roleIds?: number[];
  deptId?: number | null;
  deptIds?: number[];
  primaryDeptId?: number | null;
};
