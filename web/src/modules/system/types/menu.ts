export type AdminMenuType = 'directory' | 'menu' | 'button';

export type AdminMenuStatus = 'enabled' | 'disabled';

export type AdminMenu = {
  id: number;
  parentId: number;
  code: string;
  type: AdminMenuType;
  name: string;
  path: string;
  icon: string;
  permission: string;
  sort: number;
  status: AdminMenuStatus;
  children?: AdminMenu[];
};

export type AdminMenuPayload = {
  parentId?: number;
  code?: string;
  type?: AdminMenuType;
  name: string;
  path?: string;
  icon?: string;
  permission?: string;
  sort?: number;
  status?: AdminMenuStatus;
};
