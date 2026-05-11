import { http } from '@/core/http/client';
import type {
  AdminPasswordUpdatePayload,
  AdminPreferenceUpdatePayload,
  AdminProfile,
  AdminProfileUpdatePayload,
} from '../types/profile';

export const profileApi = {
  detail: () => http.Get<AdminProfile>('/admin/profile').send(),
  update: (payload: AdminProfileUpdatePayload) =>
    http.Put<AdminProfile>('/admin/profile', payload).send(),
  updatePassword: (payload: AdminPasswordUpdatePayload) =>
    http.Put<null>('/admin/profile/password', payload).send(),
  updatePreferences: (payload: AdminPreferenceUpdatePayload) =>
    http.Put<AdminProfile>('/admin/profile/preferences', payload).send(),
};
