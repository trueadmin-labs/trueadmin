import { crudRequestOptions } from '@trueadmin/web-core/crud';
import type { PageResult } from '@trueadmin/web-core/http';
import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { AdminPosition, AdminPositionOption, AdminPositionPayload } from '../types/position';

const normalizePageResult = (result: PageResult<AdminPosition>): PageResult<AdminPosition> => ({
  ...result,
  items: result.items ?? [],
});

export const positionApi = {
  list: async (params: CrudListParams, options?: { force?: boolean }) => {
    const result = await http
      .Get<PageResult<AdminPosition>>('/admin/organization/positions', crudRequestOptions(params))
      .send(options?.force);
    return normalizePageResult(result);
  },
  options: (deptIds?: number[]) =>
    http
      .Get<AdminPositionOption[]>('/admin/organization/positions/options', {
        params: deptIds && deptIds.length > 0 ? { deptIds: deptIds.join(',') } : undefined,
      })
      .send(),
  detail: (id: React.Key) => http.Get<AdminPosition>(`/admin/organization/positions/${id}`).send(),
  memberIds: (id: React.Key) =>
    http.Get<number[]>(`/admin/organization/positions/${id}/member-ids`).send(),
  create: (payload: AdminPositionPayload) =>
    http.Post<AdminPosition>('/admin/organization/positions', payload).send(),
  update: (id: React.Key, payload: AdminPositionPayload) =>
    http.Put<AdminPosition>(`/admin/organization/positions/${id}`, payload).send(),
  syncMembers: (id: React.Key, userIds: number[]) =>
    http.Put<AdminPosition>(`/admin/organization/positions/${id}/members`, { userIds }).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/organization/positions/${id}`).send(),
};
