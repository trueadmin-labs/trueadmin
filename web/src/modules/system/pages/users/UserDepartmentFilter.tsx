import { ApartmentOutlined } from '@ant-design/icons';
import {
  TrueAdminTreeFilter,
  type TrueAdminTreeFilterItem,
} from '@/core/filter/TrueAdminTreeFilter';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { DepartmentTreeNode } from '../../types/department';
import { ALL_DEPARTMENTS_VALUE } from './userPageModel';

type UserDepartmentFilterQuery = {
  values: Record<string, string>;
  setValue: (name: string, value?: string) => void;
};

type UserDepartmentFilterProps = {
  departmentTree: DepartmentTreeNode[];
  loading: boolean;
  query: UserDepartmentFilterQuery;
  t: TranslateFunction;
  onReload: () => void;
};

const toDepartmentTreeItems = (
  departments: DepartmentTreeNode[],
): Array<TrueAdminTreeFilterItem<string>> =>
  departments.map((department) => ({
    children: department.children ? toDepartmentTreeItems(department.children) : undefined,
    label: department.name,
    searchText: [department.name, department.code].filter(Boolean).join(' '),
    value: String(department.id),
  }));

export function UserDepartmentFilter({
  departmentTree,
  loading,
  query,
  t,
  onReload,
}: UserDepartmentFilterProps) {
  const departmentValue = query.values.deptId ?? ALL_DEPARTMENTS_VALUE;
  const departmentItems: Array<TrueAdminTreeFilterItem<string>> = [
    {
      icon: <ApartmentOutlined />,
      label: t('system.users.department.all', '全部组织'),
      value: ALL_DEPARTMENTS_VALUE,
    },
    ...toDepartmentTreeItems(departmentTree),
  ];

  return (
    <TrueAdminTreeFilter<string>
      title={t('system.users.department.title', '组织架构')}
      value={departmentValue}
      items={departmentItems}
      loading={loading}
      placeholder={t('system.users.department.placeholder', '搜索部门')}
      emptyText={t('system.users.department.empty', '暂无匹配部门')}
      reloadText={t('system.users.department.reload', '刷新组织架构')}
      expandAllText={t('system.users.department.expandAll', '展开全部')}
      collapseAllText={t('system.users.department.collapseAll', '收起全部')}
      onReload={onReload}
      onChange={(value) => {
        query.setValue('deptId', value === ALL_DEPARTMENTS_VALUE ? undefined : String(value));
      }}
    />
  );
}
