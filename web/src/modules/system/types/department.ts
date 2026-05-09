export type DepartmentTreeNode = {
  id: number;
  parentId: number;
  name: string;
  code: string;
  level: number;
  path: string;
  sort: number;
  status: 'enabled' | 'disabled';
  children?: DepartmentTreeNode[];
};

export type DepartmentPayload = {
  parentId?: number;
  code: string;
  name: string;
  sort?: number;
  status?: DepartmentTreeNode['status'];
};
