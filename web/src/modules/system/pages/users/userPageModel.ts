import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { CrudExtraQuerySchema, CrudFilterSchema } from '@/core/crud/types';
import type { AdminUser } from '../../types/admin-user';

export const ALL_DEPARTMENTS_VALUE = 'all';

export function createUserFilters({
  roleText,
  statusText,
  t,
}: {
  roleText: Record<string, string>;
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
      options: [
        { label: roleText['super-admin'], value: 'super-admin' },
        { label: roleText.admin, value: 'admin' },
        { label: roleText.operator, value: 'operator' },
        { label: roleText.auditor, value: 'auditor' },
      ],
    },
    {
      name: 'createdAt',
      label: t('system.users.column.createdAt', '创建时间'),
      requestName: 'created_at',
      type: 'dateRange',
    },
  ];
}

export const createUserExtraQuery = (): CrudExtraQuerySchema[] => [
  {
    name: 'deptId',
    requestName: 'deptId',
  },
  {
    defaultValue: '1',
    name: 'includeChildren',
  },
];
