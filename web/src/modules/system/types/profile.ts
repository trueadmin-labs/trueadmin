import type { AdminUser } from './admin-user';

export type AdminProfile = AdminUser;

export type AdminProfileUpdatePayload = {
  nickname: string;
  avatar?: string;
};

export type AdminPasswordUpdatePayload = {
  oldPassword: string;
  newPassword: string;
};

export type AdminPreferenceUpdatePayload = {
  namespace: string;
  values: Record<string, unknown>;
};
