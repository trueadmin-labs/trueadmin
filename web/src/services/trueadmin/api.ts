import { request } from '@umijs/max';

export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

export type LoginParams = {
  username: string;
  password: string;
  autoLogin?: boolean;
};

export type LoginResult = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
};

export type CurrentAdminPayload = {
  id: number;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
};

export type CurrentAdmin = CurrentAdminPayload & {
  name: string;
  access: 'admin';
};

export type AdminMenu = {
  id: number;
  parent_id: number;
  type: 'directory' | 'menu' | 'button';
  name: string;
  path: string;
  permission: string;
  sort: number;
  status: string;
  children?: AdminMenu[];
};

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const payload = await promise;
  return payload.data;
}

export async function login(
  body: LoginParams,
  options?: Record<string, unknown>,
) {
  return unwrap(
    request<ApiResponse<LoginResult>>('/api/v1/admin/auth/login', {
      method: 'POST',
      data: body,
      ...(options || {}),
    }),
  );
}

export async function currentUser(options?: Record<string, unknown>) {
  const user = await unwrap(
    request<ApiResponse<CurrentAdminPayload>>('/api/v1/admin/auth/me', {
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
    request<ApiResponse<null>>('/api/v1/admin/auth/logout', {
      method: 'POST',
      ...(options || {}),
    }),
  );
}

export async function adminMenus(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<AdminMenu[]>>('/api/v1/admin/system/menu-tree', {
      method: 'GET',
      ...(options || {}),
    }),
  );
}

export async function adminPermissions(options?: Record<string, unknown>) {
  return unwrap(
    request<ApiResponse<string[]>>('/api/v1/admin/system/permissions', {
      method: 'GET',
      ...(options || {}),
    }),
  );
}
