import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { adminUserApi } from '../../services/admin-user.api';
import { departmentApi } from '../../services/department.api';
import { positionApi } from '../../services/position.api';
import { type AdminRoleOption, roleApi } from '../../services/role.api';
import type {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
} from '../../types/admin-user';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminPositionOption } from '../../types/position';
import { toDepartmentTreeSelectData } from '../departments/departmentPageModel';
import { UserDepartmentFilter } from './UserDepartmentFilter';
import { UserFormModal } from './UserFormModal';
import { createUserColumns } from './UserTableColumns';
import { createUserExtraQuery, createUserFilters } from './userPageModel';

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<AdminUserCreatePayload>();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const editRecord = useCrudRecordDetail<AdminUser>({ load: adminUserApi.detail });
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [departmentTreeLoading, setDepartmentTreeLoading] = useState(false);
  const [positionOptions, setPositionOptions] = useState<AdminPositionOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<AdminRoleOption[]>([]);
  const editing = editRecord.record;
  const open = createOpen || editRecord.open;

  const reloadDepartmentTree = useCallback(async () => {
    setDepartmentTreeLoading(true);
    try {
      setDepartmentTree(await departmentApi.tree());
    } finally {
      setDepartmentTreeLoading(false);
    }
  }, []);

  const reloadReferences = useCallback(async () => {
    const [positions, roles] = await Promise.all([positionApi.options(), roleApi.options()]);
    setPositionOptions(positions);
    setRoleOptions(roles);
  }, []);

  useEffect(() => {
    void reloadDepartmentTree();
  }, [reloadDepartmentTree]);

  useEffect(() => {
    void reloadReferences();
  }, [reloadReferences]);

  useEffect(() => {
    if (!editRecord.open || !editing) {
      return;
    }

    form.setFieldsValue({
      deptIds: editing.deptIds,
      nickname: editing.nickname,
      positionIds: editing.positionIds,
      primaryDeptId: editing.primaryDeptId ?? null,
      status: editing.status,
      username: editing.username,
    });
  }, [editRecord.open, editing, form]);

  const statusText = useMemo<Record<AdminUser['status'], string>>(
    () => ({
      disabled: t('system.users.status.disabled', '禁用'),
      enabled: t('system.users.status.enabled', '启用'),
    }),
    [t],
  );

  const filters = useMemo(
    () => createUserFilters({ roleOptions, statusText, t }),
    [roleOptions, statusText, t],
  );

  const extraQuery = useMemo(() => createUserExtraQuery(), []);

  const columns = useMemo(() => createUserColumns({ statusText, t }), [statusText, t]);

  const treeData = useMemo(() => toDepartmentTreeSelectData(departmentTree), [departmentTree]);

  const openCreate = () => {
    editRecord.close();
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue({ status: 'enabled', deptIds: [], positionIds: [] });
  };

  const openEdit = (record: AdminUser) => {
    setCreateOpen(false);
    form.resetFields();
    void editRecord.openRecord(record.id, { initialRecord: record });
  };

  const closeForm = () => {
    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
  };

  const submit = async (
    action: CrudTableAction<AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload>,
  ) => {
    const values = await form.validateFields().catch(() => undefined);
    if (values === undefined) {
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const { password, ...rest } = values;
        await action.update?.(editing.id, password ? values : rest);
        message.success(t('system.users.success.update', '成员已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.users.success.create', '成员已创建'));
      }
      closeForm();
      await reloadReferences();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TrueAdminCrudPage<AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload>
      title={t('system.users.title', '成员管理')}
      description={t('system.users.description', '维护后台成员账号、部门归属、岗位和状态。')}
      resource="system.user"
      rowKey="id"
      columns={columns}
      service={adminUserApi}
      extraQuery={extraQuery}
      quickSearch={{ placeholder: t('system.users.quickSearch.placeholder', '搜索用户名 / 昵称') }}
      filters={filters}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('system.users.action.create', '新增成员')}
        </Button>
      }
      rowActions={{
        width: 150,
        render: ({ record }) => (
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            {t('crud.action.edit', '编辑')}
          </Button>
        ),
      }}
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
      tableScrollX={1320}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <UserFormModal
            editing={editing}
            form={form}
            loading={editRecord.loading}
            open={open}
            positionOptions={positionOptions}
            statusText={statusText}
            submitting={submitting}
            t={t}
            treeData={treeData}
            onCancel={closeForm}
            onSubmit={() => void submit(action)}
          />
        </>
      )}
    />
  );
}
