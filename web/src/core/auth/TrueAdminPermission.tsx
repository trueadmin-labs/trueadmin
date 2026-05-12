import type { ReactNode } from 'react';
import { useCurrentUserQuery } from './hooks';
import { TrueAdminForbiddenBlock } from './TrueAdminForbiddenBlock';

export type TrueAdminPermissionMode = 'and' | 'or';

export type TrueAdminPermissionProps = {
  code?: string | string[];
  mode?: TrueAdminPermissionMode;
  deny?: boolean;
  fallback?: ReactNode | 'block';
  children: ReactNode;
};

export const hasTrueAdminPermission = (
  permissions: string[] | undefined,
  code?: string | string[],
  mode: TrueAdminPermissionMode = 'or',
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

export function TrueAdminPermission({
  code,
  mode = 'or',
  deny = false,
  fallback = null,
  children,
}: TrueAdminPermissionProps) {
  const { data } = useCurrentUserQuery();
  if (!deny && hasTrueAdminPermission(data?.permissions, code, mode)) {
    return children;
  }

  if (fallback === 'block') {
    return <TrueAdminForbiddenBlock />;
  }

  return fallback;
}
