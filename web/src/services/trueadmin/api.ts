import { request } from '@umijs/max';

export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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
  parentId: number;
  parent_id: number;
  code: string;
  type: 'directory' | 'menu' | 'button';
  name: string;
  path: string;
  component: string;
  icon: string;
  permission: string;
  sort: number;
  status: 'enabled' | 'disabled' | string;
  children?: AdminMenu[];
};

export type AdminRole = {
  id: number;
  code: string;
  name: string;
  status: 'enabled' | 'disabled' | string;
  menuIds?: number[];
};

export type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  status: 'enabled' | 'disabled' | string;
  primaryDeptId?: number | null;
  deptIds?: number[];
  deptId?: number | null;
  roles: string[];
  roleIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayload = {
  username: string;
  nickname?: string;
  password?: string;
  status?: string;
  roleIds?: number[];
  deptId?: number | null;
  deptIds?: number[];
  primaryDeptId?: number | null;
};

export type AdminDepartment = {
  id: number;
  parentId: number;
  parent_id: number;
  code: string;
  name: string;
  level: number;
  path: string;
  sort: number;
  status: 'enabled' | 'disabled' | string;
  children?: AdminDepartment[];
};

export type AdminDepartmentPayload = {
  parentId?: number;
  code: string;
  name: string;
  sort?: number;
  status?: string;
};

export type ClientUser = {
  id: number;
  username: string;
  phone: string;
  email: string;
  nickname: string;
  avatar: string;
  status: 'enabled' | 'disabled' | string;
  registerChannel: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientUserPayload = {
  username?: string;
  phone?: string;
  email?: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  status?: string;
  registerChannel?: string;
};

export type AdminRolePayload = {
  code: string;
  name: string;
  status?: string;
  menuIds?: number[];
};

export type AdminMenuPayload = {
  parentId?: number;
  code?: string;
  type: AdminMenu['type'];
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  permission?: string;
  sort?: number;
  status?: string;
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
