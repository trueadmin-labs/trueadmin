import type { TreeSelectProps } from 'antd';
import { isImageIconValue } from '@/core/icon/TrueAdminIcon';
import type { AdminMenu } from '../../types/menu';

export type MenuIconMode = 'name' | 'image';

export const ROOT_PARENT_ID = 0;

export const FORM_GUTTER: [number, number] = [16, 0];

export const getMenuIconMode = (icon?: string): MenuIconMode =>
  isImageIconValue(icon) ? 'image' : 'name';

export const toTreeSelectData = (
  menus: AdminMenu[],
  disabledId?: number,
  ancestorDisabled = false,
): TreeSelectProps['treeData'] =>
  menus.map((menu) => {
    const disabled = ancestorDisabled || menu.id === disabledId;
    return {
      title: menu.name,
      value: menu.id,
      key: menu.id,
      disabled,
      children: menu.children ? toTreeSelectData(menu.children, disabledId, disabled) : undefined,
    };
  });
