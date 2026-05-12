import { crudRequestOptions } from '@trueadmin/web-core/crud';
import type { PageResult } from '@trueadmin/web-core/http';
import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { AdminMenu, AdminMenuPayload } from '../types/menu';

const flattenMenus = (menus: AdminMenu[]): AdminMenu[] =>
  menus.flatMap((menu) => [menu, ...flattenMenus(menu.children ?? [])]);

const toPageResult = (items: AdminMenu[], params: CrudListParams): PageResult<AdminMenu> => ({
  items,
  total: flattenMenus(items).length,
  page: Number(params.page ?? 1),
  pageSize: Number(params.pageSize ?? (flattenMenus(items).length || 20)),
});

export const menuApi = {
  list: async (params: CrudListParams) => toPageResult(await menuApi.tree(params), params),
  tree: (params?: CrudListParams) =>
    http.Get<AdminMenu[]>('/admin/system-config/menus/tree', crudRequestOptions(params)).send(),
  detail: (id: React.Key) => http.Get<AdminMenu>(`/admin/system-config/menus/${id}`).send(),
  create: (payload: AdminMenuPayload) =>
    http.Post<AdminMenu>('/admin/system-config/menus', payload).send(),
  update: (id: React.Key, payload: AdminMenuPayload) =>
    http.Put<AdminMenu>(`/admin/system-config/menus/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/system-config/menus/${id}`).send(),
};
