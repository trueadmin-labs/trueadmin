import { http } from '@/core/http/client';
import type { DepartmentTreeNode } from '../types/department';

export const departmentApi = {
  treeMethod: () => http.Get<DepartmentTreeNode[]>('/admin/system/departments/tree'),
  tree: () => departmentApi.treeMethod().send(),
};
