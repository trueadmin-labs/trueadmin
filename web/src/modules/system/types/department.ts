export type DepartmentTreeNode = {
  id: number;
  name: string;
  code?: string;
  children?: DepartmentTreeNode[];
};
