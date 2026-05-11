import type { AdminPasswordUpdatePayload, AdminProfileUpdatePayload } from '../../types/profile';

export type ProfileFormValues = AdminProfileUpdatePayload;

export type PasswordFormValues = AdminPasswordUpdatePayload & {
  confirmPassword: string;
};
