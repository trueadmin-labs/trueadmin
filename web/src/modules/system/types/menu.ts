export type AdminMenuType = 'directory' | 'menu' | 'button' | 'link';

export type AdminMenuOpenMode = 'blank' | 'self' | 'iframe';

export type AdminMenuSource = 'code' | 'custom';

export type AdminMenuStatus = 'enabled' | 'disabled';

export type AdminMenu = {
  id: number;
  parentId: number;
  code: string;
  type: AdminMenuType;
  name: string;
  path: string;
  url: string;
  openMode: AdminMenuOpenMode | '';
  showLinkHeader: boolean;
  icon: string;
  permission: string;
  source: AdminMenuSource;
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
  url?: string;
  openMode?: AdminMenuOpenMode;
  showLinkHeader?: boolean;
  icon?: string;
  permission?: string;
  sort?: number;
  status?: AdminMenuStatus;
};
