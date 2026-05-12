import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { CrudFilterSchema } from '@/core/crud/types';
import type { AdminMenu, AdminMenuSource, AdminMenuType } from '../../types/menu';

export const menuTypeColor: Record<AdminMenuType, string> = {
  button: 'default',
  directory: 'processing',
  link: 'warning',
  menu: 'success',
};

type MenuFilterOptions = {
  sourceText: Record<AdminMenuSource, string>;
  statusText: Record<AdminMenu['status'], string>;
  t: TranslateFunction;
  typeText: Record<AdminMenuType, string>;
};

export function createMenuFilters({
  sourceText,
  statusText,
  t,
  typeText,
}: MenuFilterOptions): CrudFilterSchema[] {
  return [
    {
      label: t('system.menus.column.type', '类型'),
      name: 'type',
      type: 'select',
      options: [
        { label: typeText.directory, value: 'directory' },
        { label: typeText.menu, value: 'menu' },
        { label: typeText.link, value: 'link' },
        { label: typeText.button, value: 'button' },
      ],
    },
    {
      label: t('system.menus.column.source', '来源'),
      name: 'source',
      type: 'select',
      options: [
        { label: sourceText.code, value: 'code' },
        { label: sourceText.custom, value: 'custom' },
      ],
    },
    {
      label: t('system.menus.column.status', '状态'),
      name: 'status',
      type: 'select',
      options: [
        { label: statusText.enabled, value: 'enabled' },
        { label: statusText.disabled, value: 'disabled' },
      ],
    },
  ];
}
