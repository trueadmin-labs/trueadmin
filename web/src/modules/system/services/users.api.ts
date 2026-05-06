import { request } from '@umijs/max';
import type { ApiResponse, PageResult } from '@/foundation/request/types';
import { unwrap } from '@/foundation/request/types';
import type { AdminRole, AdminUser, AdminUserPayload } from '../types';

export async function adminUserPage(
  params: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<PageResult<AdminUser>>>('/api/admin/system/users', {
      method: 'GET',
      params,
      ...(options || {}),
    }),
  );
}

export async function createAdminUser(
  data: AdminUserPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminUser>>('/api/admin/system/users', {
      method: 'POST',
      data,
      ...(options || {}),
    }),
  );
}

export async function updateAdminUser(
  id: number,
  data: AdminUserPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminUser>>(`/api/admin/system/users/${id}`, {
      method: 'PUT',
      data,
      ...(options || {}),
    }),
  );
}

export async function deleteAdminUser(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<null>>(`/api/admin/system/users/${id}`, {
      method: 'DELETE',
      ...(options || {}),
    }),
  );
}

export async function adminRoleOptions(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<AdminRole[]>>('/api/admin/system/users/role-options', {
      method: 'GET',
      ...(options || {}),
    }),
  );
}
