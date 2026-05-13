export type AdminPositionStatus = 'enabled' | 'disabled';

export type AdminPosition = {
  id: number;
  deptId: number;
  deptName: string;
  deptPath: string;
  code: string;
  name: string;
  type: string;
  isLeadership: boolean;
  description: string;
  sort: number;
  status: AdminPositionStatus;
  roleIds: number[];
  roleNames: string[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPositionOption = Pick<
  AdminPosition,
  'id' | 'deptId' | 'deptName' | 'deptPath' | 'code' | 'name' | 'status' | 'roleIds'
>;

export type AdminPositionPayload = {
  deptId: number;
  code: string;
  name: string;
  type?: string;
  isLeadership?: boolean;
  description?: string;
  sort?: number;
  status?: AdminPositionStatus;
  roleIds?: number[];
};
