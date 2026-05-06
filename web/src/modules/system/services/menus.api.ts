import { request } from '@umijs/max';
import type { ApiResponse } from '@/foundation/request/types';
import { unwrap } from '@/foundation/request/types';
import type { AdminMenu, AdminMenuPayload } from '../types';

export async function adminMenus(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<AdminMenu[]>>('/api/admin/system/menu-tree', {
      method: 'GET',
      ...(options || {}),
    }),
  );
}

export async function adminPermissions(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<string[]>>('/api/admin/system/permissions', {
      method: 'GET',
      ...(options || {}),
    }),
  );
}

export async function adminMenuList(
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminMenu[]>>('/api/admin/system/menus', {
      method: 'GET',
      params,
      ...(options || {}),
    }),
  );
}

export async function createAdminMenu(
  data: AdminMenuPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminMenu>>('/api/admin/system/menus', {
      method: 'POST',
      data,
      ...(options || {}),
    }),
  );
}

export async function updateAdminMenu(
  id: number,
  data: AdminMenuPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminMenu>>(`/api/admin/system/menus/${id}`, {
      method: 'PUT',
      data,
      ...(options || {}),
    }),
  );
}

export async function deleteAdminMenu(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<null>>(`/api/admin/system/menus/${id}`, {
      method: 'DELETE',
      ...(options || {}),
    }),
  );
}
