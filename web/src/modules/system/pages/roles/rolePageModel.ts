import type { CrudFilterSchema } from '@/core/crud/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminRole } from '../../types/role';

type RoleFilterOptions = {
  statusText: Record<AdminRole['status'], string>;
  t: TranslateFunction;
};

export function createRoleFilters({ statusText, t }: RoleFilterOptions): CrudFilterSchema[] {
  return [
    {
      label: t('system.roles.column.status', '状态'),
      name: 'status',
      type: 'select',
      options: [
        { label: statusText.enabled, value: 'enabled' },
        { label: statusText.disabled, value: 'disabled' },
      ],
    },
  ];
}
