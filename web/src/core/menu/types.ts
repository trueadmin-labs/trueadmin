import type { TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';

export type BackendMenu = {
  id?: number;
  code: string;
  title: string;
  i18n?: string;
  path: string;
  url?: string;
  openMode?: 'blank' | 'self' | 'iframe' | '';
  showLinkHeader?: boolean;
  icon?: string;
  type?: 'directory' | 'menu' | 'button' | 'link';
  status?: string;
  sort?: number;
  children?: BackendMenu[];
};

export type AppMenu = Omit<BackendMenu, 'children' | 'icon'> & {
  icon?: TrueAdminIconInput;
  children?: AppMenu[];
};

export type RuntimeMenu = AppMenu & {
  label: string;
  key: string;
  children?: RuntimeMenu[];
};
