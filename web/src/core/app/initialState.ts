import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import defaultSettings from '@root/config/defaultSettings';
import { clearAccessToken } from '@/core/auth/token';
import { currentUser as queryCurrentUser } from '@/modules/auth/services/auth.api';
import type { InitialState } from './types';

export const loginPath = '/user/login';

async function fetchUserInfo(): Promise<API.CurrentUser | undefined> {
  try {
    return await queryCurrentUser({ skipErrorHandler: true });
  } catch (_error) {
    clearAccessToken();
    const { pathname, search, hash } = history.location;
    history.replace(
      loginPath + '?redirect=' + encodeURIComponent(pathname + search + hash),
    );
  }
  return undefined;
}

export async function getInitialState(): Promise<InitialState> {
  const settings = defaultSettings as Partial<LayoutSettings>;

  if (history.location.pathname === loginPath) {
    return {
      fetchUserInfo,
      settings,
      settingDrawerOpen: false,
    };
  }

  return {
    fetchUserInfo,
    currentUser: await fetchUserInfo(),
    settings,
    settingDrawerOpen: false,
  };
}
