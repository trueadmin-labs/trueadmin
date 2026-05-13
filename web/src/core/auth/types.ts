export type CurrentAdminUser = {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  roles: string[];
  roleIds?: number[];
  effectiveRoles?: string[];
  permissions: string[];
  primaryDeptId?: number | null;
  deptIds: number[];
  operationDeptId?: number | null;
  preferences: Record<string, unknown>;
  positions?: Array<Record<string, unknown>>;
  directRoles?: string[];
  directRoleIds?: number[];
  positionRoles?: string[];
  positionRoleBindings?: Array<Record<string, unknown>>;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResult = {
  token?: string;
  accessToken?: string;
  expiresIn?: number;
};
