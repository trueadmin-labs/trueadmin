export type LoginParams = {
  username: string;
  password: string;
  autoLogin?: boolean;
};

export type LoginResult = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
};

export type CurrentAdminPayload = {
  id: number;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
};

export type CurrentAdmin = CurrentAdminPayload & {
  name: string;
  access: 'admin';
};
