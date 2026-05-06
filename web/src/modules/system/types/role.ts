export type AdminRole = {
  id: number;
  code: string;
  name: string;
  status: 'enabled' | 'disabled' | string;
  menuIds?: number[];
};

export type AdminRolePayload = {
  code: string;
  name: string;
  status?: string;
  menuIds?: number[];
};
