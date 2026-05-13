import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { CrudExtraQuerySchema, CrudFilterSchema } from '@/core/crud/types';
import type { AdminRoleOption } from '../../services/role.api';
import type { AdminUser } from '../../types/admin-user';

export const ALL_DEPARTMENTS_VALUE = 'all';

export function createUserFilters({
  roleOptions,
  statusText,
  t,
}: {
  roleOptions: AdminRoleOption[];
  statusText: Record<AdminUser['status'], string>;
  t: TranslateFunction;
}): CrudFilterSchema[] {
  return [
    {
      name: 'status',
      label: t('system.users.column.status', '状态'),
      type: 'select',
      options: [
        { label: statusText.enabled, value: 'enabled' },
        { label: statusText.disabled, value: 'disabled' },
      ],
    },
    {
      name: 'roles',
      label: t('system.users.column.roles', '角色'),
      type: 'select',
      mode: 'multiple',
      requestMode: 'param',
      requestName: 'roleCodes',
      options: roleOptions.map((role) => ({ label: role.name, value: role.code })),
    },
    {
      name: 'createdAt',
      label: t('system.users.column.createdAt', '创建时间'),
      type: 'dateRange',
    },
  ];
}

export const createUserExtraQuery = (): CrudExtraQuerySchema[] => [
  {
    name: 'deptId',
  },
  {
    defaultValue: '1',
    name: 'includeChildren',
  },
];
