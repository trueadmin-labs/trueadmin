declare namespace API {
  type CurrentUser = {
    id: number;
    username: string;
    nickname: string;
    roles: string[];
    permissions: string[];
    name?: string;
    avatar?: string;
    access?: 'admin';
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
  };

  type LoginResult = {
    tokenType: 'Bearer';
    accessToken: string;
    expiresIn: number;
  };

  type AdminMenu = {
    id: number;
    parent_id: number;
    type: 'directory' | 'menu' | 'button';
    name: string;
    path: string;
    permission: string;
    sort: number;
    status: string;
    children?: AdminMenu[];
  };
}
