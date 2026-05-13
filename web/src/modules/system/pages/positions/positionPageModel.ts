import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { CrudFilterSchema } from '@/core/crud/types';
import type { AdminRoleOption } from '../../services/role.api';
import type { AdminPosition, AdminPositionPayload } from '../../types/position';

export type PositionFormValues = AdminPositionPayload;

export function createPositionFilters({
  statusText,
  t,
}: {
  statusText: Record<AdminPosition['status'], string>;
  t: TranslateFunction;
}): CrudFilterSchema[] {
  return [
    {
      label: t('system.positions.column.status', '状态'),
      name: 'status',
      type: 'select',
      options: [
        { label: statusText.enabled, value: 'enabled' },
        { label: statusText.disabled, value: 'disabled' },
      ],
    },
  ];
}

export const toRoleSelectOptions = (roles: AdminRoleOption[]) =>
  roles.map((role) => ({
    label: `${role.name} (${role.code})`,
    value: role.id,
  }));
