export type ClientUser = {
  id: number;
  username: string;
  phone: string;
  email: string;
  nickname: string;
  avatar: string;
  status: 'enabled' | 'disabled' | string;
  registerChannel: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientUserPayload = {
  username?: string;
  phone?: string;
  email?: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  status?: string;
  registerChannel?: string;
};
