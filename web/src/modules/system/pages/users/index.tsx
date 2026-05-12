import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud/TrueAdminCrudPage';
import { useI18n } from '@/core/i18n/I18nProvider';
import { adminUserApi } from '../../services/admin-user.api';
import { departmentApi } from '../../services/department.api';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../../types/admin-user';
import type { DepartmentTreeNode } from '../../types/department';
import { UserDepartmentFilter } from './UserDepartmentFilter';
import { createUserColumns } from './UserTableColumns';
import { createUserExtraQuery, createUserFilters } from './userPageModel';

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
      admin: t('system.users.role.admin', '管理员'),
      auditor: t('system.users.role.auditor', '审计员'),
      operator: t('system.users.role.operator', '运营管理员'),
      'super-admin': t('system.users.role.superAdmin', '超级管理员'),
      super_admin: t('system.users.role.superAdmin', '超级管理员'),
    }),
    [t],
  );

  const filters = useMemo(
    () => createUserFilters({ roleText, statusText, t }),
    [roleText, statusText, t],
  );

  const extraQuery = useMemo(() => createUserExtraQuery(), []);

  const columns = useMemo(
    () => createUserColumns({ roleText, statusText, t }),
    [roleText, statusText, t],
  );

  return (
    <TrueAdminCrudPage<AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload>
      title={t('system.users.title', '成员管理')}
      description={t('system.users.description', '维护后台成员账号、部门归属、角色和状态。')}
      resource="system.user"
      rowKey="id"
      columns={columns}
      service={adminUserApi}
      extraQuery={extraQuery}
      quickSearch={{ placeholder: t('system.users.quickSearch.placeholder', '搜索用户名 / 昵称') }}
      filters={filters}
      asideWidth={260}
      aside={({ query }) => (
        <UserDepartmentFilter
          departmentTree={departmentTree}
          loading={departmentTreeLoading}
          query={query}
          t={t}
          onReload={() => {
            void reloadDepartmentTree();
          }}
        />
      )}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.users.deleteConfirm', '确认删除该成员吗？'),
        deleteSuccessMessage: t('system.users.deleteSuccess', '成员已删除'),
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
