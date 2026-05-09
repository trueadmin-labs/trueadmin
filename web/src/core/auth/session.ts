import { tokenStorage } from '@/shared/utils/storage';

const AUTH_UNAUTHORIZED_CODES = new Set([
  'KERNEL.AUTH.UNAUTHORIZED',
  'KERNEL.AUTH.TOKEN_EXPIRED',
]);
let redirecting = false;

const isLoginPath = (pathname: string) => pathname === '/login';

const toLoginUrl = () => {
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (isLoginPath(window.location.pathname)) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(current)}`;
};

export const isAuthUnauthorizedCode = (code?: string | number | null): boolean =>
  AUTH_UNAUTHORIZED_CODES.has(String(code ?? ''));

export const handleAuthUnauthorized = () => {
  tokenStorage.clear();

  if (typeof window === 'undefined' || isLoginPath(window.location.pathname) || redirecting) {
    return;
  }

  redirecting = true;
  window.location.replace(toLoginUrl());
};
