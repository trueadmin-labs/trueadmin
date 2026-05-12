import { ApartmentOutlined, TeamOutlined } from '@ant-design/icons';
import { TrueAdminTreeFilter, type TrueAdminTreeFilterItem } from '@trueadmin/web-antd/filter';
import type { TrueAdminRemoteSelectValue } from '@trueadmin/web-antd/remote-select';
import { Space, Tag, Typography } from 'antd';
import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CrudColumns, CrudService } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import {
  TrueAdminRemoteTableSelect,
  type TrueAdminRemoteTableSelectProps,
} from '@/core/selector/TrueAdminRemoteTableSelect';
import { adminUserApi } from '../services/admin-user.api';
import { departmentApi } from '../services/department.api';
import type { AdminUser } from '../types/admin-user';
import type { DepartmentTreeNode } from '../types/department';

export type TrueAdminUserSelectProps<
  TValue extends TrueAdminRemoteSelectValue = number,
  TMultiple extends boolean = false,
> = Omit<
  TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>,
  'fetchByValues' | 'fetchOptions' | 'getLabel' | 'getValue' | 'optionRender' | 'picker'
> & {
  picker?: Partial<TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>['picker']>;
  fetchByValues?: TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>['fetchByValues'];
  fetchDepartments?: () => Promise<DepartmentTreeNode[]>;
  fetchOptions?: TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>['fetchOptions'];
  getLabel?: TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>['getLabel'];
  getValue?: (user: AdminUser) => TValue;
  optionRender?: TrueAdminRemoteTableSelectProps<AdminUser, TValue, TMultiple>['optionRender'];
  showDepartmentAside?: boolean;
};

const ALL_DEPARTMENTS_VALUE = 'all';

const defaultGetUserValue = <TValue extends TrueAdminRemoteSelectValue>(user: AdminUser) =>
  user.id as TValue;

const toDepartmentTreeItems = (
  departments: DepartmentTreeNode[],
): Array<TrueAdminTreeFilterItem<string>> =>
  departments.map((department) => ({
    children: department.children ? toDepartmentTreeItems(department.children) : undefined,
    label: department.name,
    searchText: [department.name, department.code].filter(Boolean).join(' '),
    value: String(department.id),
  }));

export function TrueAdminUserSelect<
  TValue extends TrueAdminRemoteSelectValue = number,
  TMultiple extends boolean = false,
>({
  fetchByValues,
  fetchDepartments = departmentApi.tree,
  fetchOptions,
  getLabel,
  getValue = defaultGetUserValue,
  optionRender,
  picker,
  showDepartmentAside = true,
  ...selectProps
}: TrueAdminUserSelectProps<TValue, TMultiple>) {
  const { t } = useI18n();
  const [department, setDepartment] = useState(ALL_DEPARTMENTS_VALUE);
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    setDepartmentLoading(true);
    try {
      setDepartments(await fetchDepartments());
    } finally {
      setDepartmentLoading(false);
    }
  }, [fetchDepartments]);

  useEffect(() => {
    if (showDepartmentAside) {
      void loadDepartments();
    }
  }, [loadDepartments, showDepartmentAside]);

  const departmentItems = useMemo<Array<TrueAdminTreeFilterItem<string>>>(
    () => [
      {
        icon: <ApartmentOutlined />,
        label: t('system.users.department.all', '全部组织'),
        value: ALL_DEPARTMENTS_VALUE,
      },
      ...toDepartmentTreeItems(departments),
    ],
    [departments, t],
  );

  const service = useMemo<CrudService<AdminUser>>(
    () => ({
      list: (params, options) =>
        adminUserApi.list(
          {
            ...params,
            params: {
              ...params.params,
              ...(department === ALL_DEPARTMENTS_VALUE ? {} : { deptId: department }),
            },
          },
          options,
        ),
    }),
    [department],
  );

  const columns = useMemo<CrudColumns<AdminUser>>(
    () => [
      { dataIndex: 'id', title: 'ID', width: 72 },
      {
        dataIndex: 'username',
        title: t('system.users.column.username', '用户名'),
        render: (_, record) => (
          <Space size={6}>
            <TeamOutlined />
            <span>{record.username}</span>
          </Space>
        ),
      },
      { dataIndex: 'nickname', title: t('system.users.column.nickname', '昵称') },
      {
        dataIndex: 'status',
        title: t('system.users.column.status', '状态'),
        width: 96,
        render: (_, record) => (
          <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
            {record.status === 'enabled'
              ? t('system.users.status.enabled', '启用')
              : t('system.users.status.disabled', '禁用')}
          </Tag>
        ),
      },
    ],
    [t],
  );

  const defaultFetchUsers = useCallback(
    async ({ keyword, page, pageSize }: { keyword: string; page?: number; pageSize?: number }) => {
      const result = await adminUserApi.list({ keyword, page, pageSize });
      return result.items ?? [];
    },
    [],
  );

  const defaultFetchUsersByValues = useCallback(
    async (values: TValue[]) => {
      const result = await adminUserApi.list({ page: 1, pageSize: Math.max(values.length, 20) });
      const valueSet = new Set(values.map(String));
      return (result.items ?? []).filter((user) => valueSet.has(String(getValue(user))));
    },
    [getValue],
  );
  const defaultGetLabel = useCallback((user: AdminUser) => user.nickname || user.username, []);
  const defaultOptionRender = useCallback(
    (user: AdminUser) => (
      <Space size={8}>
        <span>{user.nickname || user.username}</span>
        <Typography.Text type="secondary">{user.username}</Typography.Text>
      </Space>
    ),
    [],
  );

  return (
    <TrueAdminRemoteTableSelect<AdminUser, TValue, TMultiple>
      placeholder={t('system.users.select.placeholder', '搜索用户')}
      {...selectProps}
      fetchByValues={fetchByValues ?? defaultFetchUsersByValues}
      fetchOptions={fetchOptions ?? defaultFetchUsers}
      getLabel={getLabel ?? defaultGetLabel}
      getValue={getValue}
      optionRender={optionRender ?? defaultOptionRender}
      picker={{
        title: t('system.users.select.modalTitle', '选择用户'),
        rowKey: (record) => getValue(record) as Key,
        resource: 'system.user.select',
        columns,
        service,
        quickSearch: {
          placeholder: t('system.users.quickSearch.placeholder', '搜索用户名 / 昵称'),
        },
        aside: showDepartmentAside ? (
          <TrueAdminTreeFilter<string>
            title={t('system.users.department.title', '组织架构')}
            value={department}
            items={departmentItems}
            loading={departmentLoading}
            placeholder={t('system.users.department.placeholder', '搜索部门')}
            onReload={() => {
              void loadDepartments();
            }}
            onChange={(value) => setDepartment(String(value))}
          />
        ) : undefined,
        ...picker,
      }}
    />
  );
}
