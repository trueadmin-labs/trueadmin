import { crudRequestOptions } from '@trueadmin/web-core/crud';
import { ApiError } from '@trueadmin/web-core/error';
import type { ApiEnvelope, PageResult } from '@trueadmin/web-core/http';
import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type {
  AdminRole,
  AdminRoleDataPolicy,
  AdminRolePayload,
  DataPolicyMetadata,
} from '../types/role';

export type AdminRoleOption = {
  id: number;
  code: string;
  name: string;
  sort: number;
  status: string;
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
  http.Get<RoleListResponse<TRole>>(url, crudRequestOptions(params));

export const roleApi = {
  list: (params: CrudListParams) =>
    http.Get<PageResult<AdminRole>>('/admin/organization/roles', crudRequestOptions(params)).send(),
  options: async () =>
    unwrapRoleList<AdminRoleOption>(
      await roleListMethod<AdminRoleOption>('/admin/organization/roles/options').send(),
    ),
  detail: (id: React.Key) => http.Get<AdminRole>(`/admin/organization/roles/${id}`).send(),
  create: (payload: AdminRolePayload) =>
    http.Post<AdminRole>('/admin/organization/roles', payload).send(),
  update: (id: React.Key, payload: AdminRolePayload) =>
    http.Put<AdminRole>(`/admin/organization/roles/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/organization/roles/${id}`).send(),
  authorize: (id: React.Key, payload: { menuIds: number[]; dataPolicies: AdminRoleDataPolicy[] }) =>
    http.Post<AdminRole>(`/admin/organization/roles/${id}/authorize`, payload).send(),
  dataPolicyMetadata: () =>
    http.Get<DataPolicyMetadata>('/admin/system-config/data-policies/metadata').send(),
};
