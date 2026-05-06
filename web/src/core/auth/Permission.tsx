import type { ReactNode } from 'react';
import { ForbiddenBlock } from './ForbiddenBlock';
import { useCurrentUserQuery } from './hooks';

export type PermissionMode = 'and' | 'or';

type PermissionProps = {
  code?: string | string[];
  mode?: PermissionMode;
  deny?: boolean;
  fallback?: ReactNode | 'block';
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

export function Permission({
  code,
  mode = 'or',
  deny = false,
  fallback = null,
  children,
}: PermissionProps) {
  const { data } = useCurrentUserQuery();
  if (!deny && hasPermission(data?.permissions, code, mode)) {
    return children;
  }

  if (fallback === 'block') {
    return <ForbiddenBlock />;
  }

  return fallback;
}
