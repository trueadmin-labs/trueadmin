import type { CrudListParams } from '@/core/crud/types';
import { http } from '@/core/http/client';
import type { PageResult } from '@/core/http/types';
import type { DepartmentPayload, DepartmentTreeNode } from '../types/department';

const flattenDepartments = (departments: DepartmentTreeNode[]): DepartmentTreeNode[] =>
  departments.flatMap((department) => [
    department,
    ...flattenDepartments(department.children ?? []),
  ]);

const toPageResult = (
  items: DepartmentTreeNode[],
  params: CrudListParams,
): PageResult<DepartmentTreeNode> => ({
  items,
  total: flattenDepartments(items).length,
  page: Number(params.page ?? 1),
  pageSize: Number(params.pageSize ?? (flattenDepartments(items).length || 20)),
});

export const departmentApi = {
  list: async (params: CrudListParams) => toPageResult(await departmentApi.tree(params), params),
  treeMethod: () => http.Get<DepartmentTreeNode[]>('/admin/system/departments/tree'),
  tree: (params?: CrudListParams) =>
    http
      .Get<DepartmentTreeNode[]>('/admin/system/departments/tree', params ? { params } : undefined)
      .send(),
  detail: (id: React.Key) => http.Get<DepartmentTreeNode>(`/admin/system/departments/${id}`).send(),
  create: (payload: DepartmentPayload) =>
    http.Post<DepartmentTreeNode>('/admin/system/departments', payload).send(),
  update: (id: React.Key, payload: DepartmentPayload) =>
    http.Put<DepartmentTreeNode>(`/admin/system/departments/${id}`, payload).send(),
  delete: (id: React.Key) => http.Delete<null>(`/admin/system/departments/${id}`).send(),
};
