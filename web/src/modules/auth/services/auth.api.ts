import { request } from '@umijs/max';
import type { ApiResponse } from '@/foundation/request/types';
import { unwrap } from '@/foundation/request/types';
import type { CurrentAdminPayload, LoginParams, LoginResult } from '../types';

export async function login(
  body: LoginParams,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<LoginResult>>('/api/admin/auth/login', {
      method: 'POST',
      data: body,
      ...(options || {}),
    }),
  );
}

export async function currentUser(options?: Record<string, unknown>) {
  const user = await unwrap(
    request<ApiResponse<CurrentAdminPayload>>('/api/admin/auth/me', {
      method: 'GET',
      ...(options || {}),
    }),
  );

  return {
    ...user,
    name: user.nickname || user.username,
    access: 'admin' as const,
  };
}

export async function outLogin(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<null>>('/api/admin/auth/logout', {
      method: 'POST',
      ...(options || {}),
    }),
  );
}
