import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import { clearAccessToken } from '@/core/auth/token';
import { AvatarDropdown, Footer, LangDropdown } from '@/core/layout';
import { backendMenusToProMenus } from '@/core/menu';
import { adminMenus } from '@/modules/system/services';
import { loginPath } from './initialState';

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    menuItemRender: (item, dom) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    actionsRender: () => [<LangDropdown key="lang" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: initialState?.currentUser?.name,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        clearAccessToken();
        history.replace(
          loginPath + '?redirect=' + encodeURIComponent(
            location.pathname + location.search + location.hash,
          ),
        );
      }
    },
    menu: {
      request: async () => {
        if (!initialState?.currentUser || history.location.pathname === loginPath) {
          return [];
        }

        const menus = await adminMenus({ skipErrorHandler: true });
        return backendMenusToProMenus(menus);
      },
    },
    links: [],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          {children}
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            collapse={initialState?.settingDrawerOpen}
            onCollapseChange={(open) => {
              setInitialState((s) => ({
                ...s,
                settingDrawerOpen: open,
              }));
            }}
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((s) => ({
                ...s,
                settings,
              }));
            }}
          />
        </>
      );
    },
    ...initialState?.settings,
  };
};
