export type AdminMenu = {
  id: number;
  parentId: number;
  parent_id: number;
  code: string;
  type: 'directory' | 'menu' | 'button';
  name: string;
  path: string;
  component: string;
  icon: string;
  permission: string;
  sort: number;
  status: 'enabled' | 'disabled' | string;
  children?: AdminMenu[];
};

export type AdminMenuPayload = {
  parentId?: number;
  code?: string;
  type: AdminMenu['type'];
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  permission?: string;
  sort?: number;
  status?: string;
};
