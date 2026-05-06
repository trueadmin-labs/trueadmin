import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from './api';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const useCurrentUserQuery = () =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.me().send(),
  });

export const useLoginMutation = () =>
  useMutation({
    mutationFn: (payload: { username: string; password: string }) => authApi.login(payload).send(),
  });

export const useLogoutMutation = () =>
  useMutation({
    mutationFn: () => authApi.logout().send(),
  });
