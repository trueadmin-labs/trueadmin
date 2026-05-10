import { http } from '@/core/http/client';
import type { BackendMenu } from './types';

export const menuApi = {
  tree: () => http.Get<BackendMenu[]>('/admin/system-config/menu-tree'),
};
