import type { ReactNode } from 'react';
import { useCurrentUserQuery } from './hooks';

export type PermissionMode = 'and' | 'or';

type PermissionProps = {
  code?: string | string[];
  mode?: PermissionMode;
  fallback?: ReactNode;
  children: ReactNode;
};

export const hasPermission = (
  permissions: string[] | undefined,
  code?: string | string[],
  mode: PermissionMode = 'or',
): boolean => {
  if (!code) {
    return true;
  }
  if (permissions?.includes('*')) {
    return true;
  }

  const codes = Array.isArray(code) ? code : [code];
  return mode === 'and'
    ? codes.every((item) => permissions?.includes(item))
    : codes.some((item) => permissions?.includes(item));
};

export function Permission({ code, mode = 'or', fallback = null, children }: PermissionProps) {
  const { data } = useCurrentUserQuery();
  return hasPermission(data?.permissions, code, mode) ? children : fallback;
}
