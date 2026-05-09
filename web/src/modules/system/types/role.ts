export type AdminRoleStatus = 'enabled' | 'disabled';

export type AdminRole = {
  id: number;
  parentId: number;
  code: string;
  name: string;
  level: number;
  path: string;
  sort: number;
  status: AdminRoleStatus;
  menuIds?: number[];
  children?: AdminRole[];
};

export type AdminRolePayload = {
  parentId?: number;
  code: string;
  name: string;
  sort?: number;
  status?: AdminRoleStatus;
  menuIds?: number[];
};
