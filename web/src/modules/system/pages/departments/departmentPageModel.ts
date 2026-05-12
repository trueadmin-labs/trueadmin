import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { TreeSelectProps } from 'antd';
import type { CrudFilterSchema } from '@/core/crud/types';
import type { DepartmentPayload, DepartmentTreeNode } from '../../types/department';

export type DepartmentFormValues = DepartmentPayload;

export const ROOT_PARENT_ID = 0;

export const toDepartmentTreeSelectData = (
  departments: DepartmentTreeNode[],
  disabledId?: number,
  ancestorDisabled = false,
): TreeSelectProps['treeData'] =>
  departments.map((department) => {
    const disabled = ancestorDisabled || department.id === disabledId;
    return {
      title: department.name,
      value: department.id,
      key: department.id,
      disabled,
      children: department.children
        ? toDepartmentTreeSelectData(department.children, disabledId, disabled)
        : undefined,
    };
  });

export function createDepartmentFilters({
  statusText,
  t,
}: {
  statusText: Record<DepartmentTreeNode['status'], string>;
  t: TranslateFunction;
}): CrudFilterSchema[] {
  return [
    {
      label: t('system.departments.column.status', '状态'),
      name: 'status',
      type: 'select',
      options: [
        { label: statusText.enabled, value: 'enabled' },
        { label: statusText.disabled, value: 'disabled' },
      ],
    },
  ];
}
