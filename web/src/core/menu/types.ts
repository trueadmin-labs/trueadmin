export type BackendMenu = {
  id?: number;
  code: string;
  title: string;
  i18n?: string;
  path: string;
  url?: string;
  openMode?: 'blank' | 'self' | 'iframe' | '';
  icon?: string;
  type?: 'directory' | 'menu' | 'button' | 'link';
  status?: string;
  sort?: number;
  children?: BackendMenu[];
};

export type RuntimeMenu = BackendMenu & {
  label: string;
  key: string;
  children?: RuntimeMenu[];
};
