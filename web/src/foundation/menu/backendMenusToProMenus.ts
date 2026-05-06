import {
  AppstoreOutlined,
  DashboardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';
import React from 'react';
import type { AdminMenu } from '@/modules/system/types';

const iconMap = {
  appstore: React.createElement(AppstoreOutlined),
  dashboard: React.createElement(DashboardOutlined),
  setting: React.createElement(SettingOutlined),
} satisfies Record<string, React.ReactNode>;

function iconOf(icon: string): React.ReactNode | undefined {
  return iconMap[icon as keyof typeof iconMap];
}

export function backendMenusToProMenus(menus: AdminMenu[]): MenuDataItem[] {
  return menus
    .filter((menu) => menu.type !== 'button')
    .map((menu) => {
      const children = menu.children ? backendMenusToProMenus(menu.children) : undefined;
      const item: MenuDataItem = {
        key: menu.code || menu.path || String(menu.id),
        name: menu.name,
        path: menu.path || undefined,
        icon: iconOf(menu.icon),
        locale: false,
        children: children && children.length > 0 ? children : undefined,
      };

      return item;
    });
}
