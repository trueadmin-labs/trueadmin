export type AdminLoginLogStatus = 'success' | 'failed' | string;

export type AdminLoginLog = {
  id: number;
  adminUserId?: number | null;
  username: string;
  ip: string;
  userAgent: string;
  status: AdminLoginLogStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOperationLog = {
  id: number;
  module: string;
  action: string;
  remark: string;
  principalType: string;
  principalId: string;
  operatorType: string;
  operatorId: string;
  operationDeptId?: number | null;
  context: Record<string, unknown> | unknown[];
  createdAt: string;
  updatedAt: string;
};
