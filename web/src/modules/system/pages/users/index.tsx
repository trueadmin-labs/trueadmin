import { ApartmentOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import type { CrudColumns, CrudExtraQuerySchema, CrudFilterSchema } from '@/core/crud/types';
import {
  TrueAdminTreeFilter,
  type TrueAdminTreeFilterItem,
} from '@/core/filter/TrueAdminTreeFilter';
import { useI18n } from '@/core/i18n/I18nProvider';
import { adminUserApi } from '../../services/admin-user.api';
import { departmentApi } from '../../services/department.api';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../../types/admin-user';
import type { DepartmentTreeNode } from '../../types/department';

const roleColorMap: Record<string, string> = {
  auditor: 'default',
  operator: 'processing',
  'super-admin': 'gold',
  super_admin: 'gold',
};

const ALL_DEPARTMENTS_VALUE = 'all';

const toDepartmentTreeItems = (
  departments: DepartmentTreeNode[],
): Array<TrueAdminTreeFilterItem<string>> =>
  departments.map((department) => ({
    children: department.children ? toDepartmentTreeItems(department.children) : undefined,
    label: department.name,
    searchText: [department.name, department.code].filter(Boolean).join(' '),
    value: String(department.id),
  }));

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [departmentTreeLoading, setDepartmentTreeLoading] = useState(false);

  const reloadDepartmentTree = useCallback(async () => {
    setDepartmentTreeLoading(true);
    try {
      setDepartmentTree(await departmentApi.tree());
    } finally {
      setDepartmentTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadDepartmentTree();
  }, [reloadDepartmentTree]);

  const statusText = useMemo<Record<AdminUser['status'], string>>(
    () => ({
      disabled: t('system.users.status.disabled', '禁用'),
      enabled: t('system.users.status.enabled', '启用'),
    }),
    [t],
  );

  const roleText = useMemo<Record<string, string>>(
    () => ({
      auditor: t('system.users.role.auditor', '审计员'),
      operator: t('system.users.role.operator', '运营管理员'),
      'super-admin': t('system.users.role.superAdmin', '超级管理员'),
      super_admin: t('system.users.role.superAdmin', '超级管理员'),
    }),
    [t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
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
        options: [
          { label: roleText.super_admin, value: 'super_admin' },
          { label: roleText.operator, value: 'operator' },
          { label: roleText.auditor, value: 'auditor' },
        ],
      },
      {
        name: 'createdAt',
        label: t('system.users.column.createdAt', '创建时间'),
        type: 'dateRange',
      },
    ],
    [roleText, statusText, t],
  );

  const extraQuery = useMemo<CrudExtraQuerySchema[]>(
    () => [
      {
        name: 'deptId',
        requestName: false,
        transform: ({ value }) => (value === ALL_DEPARTMENTS_VALUE ? {} : { deptId: value }),
      },
      {
        defaultValue: '1',
        name: 'includeChildren',
      },
    ],
    [],
  );

  const departmentItems = useMemo<Array<TrueAdminTreeFilterItem<string>>>(
    () => [
      {
        icon: <ApartmentOutlined />,
        label: t('system.users.department.all', '全部组织'),
        value: ALL_DEPARTMENTS_VALUE,
      },
      ...toDepartmentTreeItems(departmentTree),
    ],
    [departmentTree, t],
  );

  const columns = useMemo<CrudColumns<AdminUser>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 72,
        sorter: true,
      },
      {
        title: t('system.users.column.username', '用户名'),
        dataIndex: 'username',
        width: 180,
      },
      {
        title: t('system.users.column.nickname', '昵称'),
        dataIndex: 'nickname',
        width: 180,
      },
      {
        title: t('system.users.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => (
          <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
            {statusText[record.status]}
          </Tag>
        ),
      },
      {
        title: t('system.users.column.roles', '角色'),
        dataIndex: 'roles',
        width: 260,
        render: (_, record) =>
          record.roles.map((role) => (
            <Tag color={roleColorMap[role] ?? 'default'} key={role}>
              {roleText[role] ?? role}
            </Tag>
          )),
      },
      {
        title: t('system.users.column.createdAt', '创建时间'),
        dataIndex: 'createdAt',
        width: 180,
        sorter: true,
      },
    ],
    [roleText, statusText, t],
  );

  return (
    <TrueAdminCrudPage<AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload>
      title={t('system.users.title', '管理员用户')}
      description={t('system.users.description', '维护后台管理员账号、状态和角色信息。')}
      resource="system.user"
      rowKey="id"
      columns={columns}
      service={adminUserApi}
      extraQuery={extraQuery}
      quickSearch={{ placeholder: t('system.users.quickSearch.placeholder', '搜索用户名 / 昵称') }}
      filters={filters}
      asideWidth={260}
      aside={({ query }) => {
        const departmentValue = query.values.deptId ?? ALL_DEPARTMENTS_VALUE;
        return (
          <TrueAdminTreeFilter<string>
            title={t('system.users.department.title', '组织架构')}
            value={departmentValue}
            items={departmentItems}
            loading={departmentTreeLoading}
            placeholder={t('system.users.department.placeholder', '搜索部门')}
            emptyText={t('system.users.department.empty', '暂无匹配部门')}
            reloadText={t('system.users.department.reload', '刷新组织架构')}
            expandAllText={t('system.users.department.expandAll', '展开全部')}
            collapseAllText={t('system.users.department.collapseAll', '收起全部')}
            onReload={() => {
              void reloadDepartmentTree();
            }}
            onChange={(value) => {
              query.setValue('deptId', value === ALL_DEPARTMENTS_VALUE ? undefined : String(value));
            }}
          />
        );
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.users.deleteConfirm', '确认删除该管理员用户吗？'),
        deleteSuccessMessage: t('system.users.deleteSuccess', '管理员用户已删除'),
        deleteText: t('crud.action.delete', '删除'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) =>
          t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        quickSearchPlaceholder: t('system.users.quickSearch.placeholder', '搜索用户名 / 昵称'),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{
        quickSearchInputProps: { allowClear: true },
        reloadButtonProps: { title: t('crud.action.reload', '刷新') },
      }}
      filterPanelProps={{
        formProps: { colon: false },
      }}
      tableProps={{
        size: 'middle',
      }}
      paginationProps={{
        showQuickJumper: true,
      }}
      tableScrollX={1080}
    />
  );
}
