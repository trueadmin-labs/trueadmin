import { request } from '@umijs/max';
import type { ApiResponse, PageResult } from '@/foundation/request/types';
import { unwrap } from '@/foundation/request/types';
import type { AdminRole, AdminRolePayload } from '../types';

export async function adminRolePage(
  params: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<PageResult<AdminRole>>>('/api/admin/system/roles', {
      method: 'GET',
      params,
      ...(options || {}),
    }),
  );
}

export async function adminRoleDetail(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminRole>>(`/api/admin/system/roles/${id}`, {
      method: 'GET',
      ...(options || {}),
    }),
  );
}

export async function createAdminRole(
  data: AdminRolePayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminRole>>('/api/admin/system/roles', {
      method: 'POST',
      data,
      ...(options || {}),
    }),
  );
}

export async function updateAdminRole(
  id: number,
  data: AdminRolePayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminRole>>(`/api/admin/system/roles/${id}`, {
      method: 'PUT',
      data,
      ...(options || {}),
    }),
  );
}

export async function deleteAdminRole(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<null>>(`/api/admin/system/roles/${id}`, {
      method: 'DELETE',
      ...(options || {}),
    }),
  );
}

export async function authorizeAdminRoleMenus(
  id: number,
  menuIds: number[],
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminRole>>(`/api/admin/system/roles/${id}/menus`, {
      method: 'POST',
      data: { menuIds },
      ...(options || {}),
    }),
  );
}
