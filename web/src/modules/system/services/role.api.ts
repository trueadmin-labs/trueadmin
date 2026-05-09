import type { CrudListParams } from '@/core/crud/types';
import { ApiError } from '@/core/error/ApiError';
import { http } from '@/core/http/client';
import type { ApiEnvelope, PageResult } from '@/core/http/types';
import type { AdminRole, AdminRolePayload } from '../types/role';

export type AdminRoleOption = {
  id: number;
  parentId: number;
  code: string;
  name: string;
  level: number;
  path: string;
  sort: number;
  status: string;
};

export type AdminRoleTreeNode = AdminRoleOption & {
  children?: AdminRoleTreeNode[];
};

type RoleListResponse<TRole> = TRole[] | ApiEnvelope<TRole[]>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const describeValue = (value: unknown) => ({
  receivedType: Array.isArray(value) ? 'array' : typeof value,
  receivedKeys: isRecord(value) ? Object.keys(value) : [],
  received: value,
});

const unwrapRoleList = <TRole>(value: RoleListResponse<TRole> | unknown): TRole[] => {
  if (Array.isArray(value)) {
    return value as TRole[];
  }

  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data as TRole[];
  }

  throw new ApiError(
    'SYSTEM.ROLE_OPTIONS.INVALID_RESPONSE',
    '角色接口返回结构异常',
    undefined,
    describeValue(value),
  );
};

const roleListMethod = <TRole>(url: string, params?: CrudListParams) =>
  http.Get<RoleListResponse<TRole>>(url, params ? { params } : undefined);

export const roleApi = {
  list: (params: CrudListParams) =>
    http.Get<PageResult<AdminRole>>('/admin/system/roles', { params }).send(),
  tree: async (params?: CrudListParams) =>
    unwrapRoleList<AdminRole>(
      await roleListMethod<AdminRole>('/admin/system/roles/tree', params).send(),
    ),
  options: async () =>
    unwrapRoleList<AdminRoleOption>(
      await roleListMethod<AdminRoleOption>('/admin/system/roles/options').send(),
    ),
  detail: (id: React.Key) => http.Get<AdminRole>(`/admin/system/roles/${id}`).send(),
  create: (payload: AdminRolePayload) =>
    http.Post<AdminRole>('/admin/system/roles', payload).send(),
  update: (id: React.Key, payload: AdminRolePayload) =>
    http.Put<AdminRole>(`/admin/system/roles/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/system/roles/${id}`).send(),
  authorizeMenus: (id: React.Key, menuIds: number[]) =>
    http.Post<AdminRole>(`/admin/system/roles/${id}/menus`, { menuIds }).send(),
};
