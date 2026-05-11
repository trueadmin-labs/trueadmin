export type CurrentAdminUser = {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  primaryDeptId?: number | null;
  deptIds: number[];
  operationDeptId?: number | null;
  preferences: Record<string, unknown>;
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
