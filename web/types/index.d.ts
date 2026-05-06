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
}
