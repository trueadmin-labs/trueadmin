import { request } from '@umijs/max';
import type { ApiResponse, PageResult } from '@/foundation/request/types';
import { unwrap } from '@/foundation/request/types';
import type { ClientUser, ClientUserPayload } from '../types';

export async function clientUserPage(
  params: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<PageResult<ClientUser>>>('/api/admin/system/client-users', {
      method: 'GET',
      params,
      ...(options || {}),
    }),
  );
}

export async function createClientUser(
  data: ClientUserPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<ClientUser>>('/api/admin/system/client-users', {
      method: 'POST',
      data,
      ...(options || {}),
    }),
  );
}

export async function updateClientUser(
  id: number,
  data: ClientUserPayload,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<ClientUser>>(`/api/admin/system/client-users/${id}`, {
      method: 'PUT',
      data,
      ...(options || {}),
    }),
  );
}

export async function deleteClientUser(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<null>>(`/api/admin/system/client-users/${id}`, {
      method: 'DELETE',
      ...(options || {}),
    }),
  );
}

export async function enableClientUser(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<ClientUser>>(`/api/admin/system/client-users/${id}/enable`, {
      method: 'PUT',
      ...(options || {}),
    }),
  );
}

export async function disableClientUser(
  id: number,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<ClientUser>>(`/api/admin/system/client-users/${id}/disable`, {
      method: 'PUT',
      ...(options || {}),
    }),
  );
}
