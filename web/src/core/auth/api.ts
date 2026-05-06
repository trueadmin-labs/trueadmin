import { http } from '@/core/http/client';
import type { CurrentAdminUser, LoginPayload, LoginResult } from './types';

export const authApi = {
  login: (payload: LoginPayload) => http.Post<LoginResult>('/admin/auth/login', payload),
  logout: () => http.Post<null>('/admin/auth/logout'),
  me: () => http.Get<CurrentAdminUser>('/admin/auth/me'),
};
