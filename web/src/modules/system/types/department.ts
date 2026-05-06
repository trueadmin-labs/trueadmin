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
