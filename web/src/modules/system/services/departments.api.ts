import { request } from '@umijs/max';
import type { ApiResponse } from '@/core/request/types';
import { unwrap } from '@/core/request/types';
import type { AdminDepartment, AdminDepartmentPayload } from '../types';

export async function adminDepartmentList(
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminDepartment[]>>('/api/admin/system/departments', {
      method: 'GET',
      params,
      ...(options || {}),
    }),
  );
}

export async function createAdminDepartment(
  data: AdminDepartmentPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminDepartment>>('/api/admin/system/departments', {
      method: 'POST',
      data,
      ...(options || {}),
    }),
  );
}

export async function updateAdminDepartment(
  id: number,
  data: AdminDepartmentPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<AdminDepartment>>(`/api/admin/system/departments/${id}`, {
      method: 'PUT',
      data,
      ...(options || {}),
    }),
  );
}

export async function deleteAdminDepartment(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<null>>(`/api/admin/system/departments/${id}`, {
      method: 'DELETE',
      ...(options || {}),
    }),
  );
}
