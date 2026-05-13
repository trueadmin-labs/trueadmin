import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudService, CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { roleApi } from '../../services/role.api';
import type { AdminRole, AdminRolePayload } from '../../types/role';
import { RoleAuthorizeModal } from './RoleAuthorizeModal';
import { RoleFormModal } from './RoleFormModal';
import { RoleRowActions } from './RoleRowActions';
import { createRoleColumns } from './RoleTableColumns';
import { isBuiltinRole, type RoleFormValues } from './roleAuthorization';
import { createRoleFilters } from './rolePageModel';
import { useRoleAuthorization } from './useRoleAuthorization';

const roleService: CrudService<AdminRole, AdminRolePayload, AdminRolePayload> = {
  list: roleApi.list,
  create: roleApi.create,
  update: roleApi.update,
  delete: roleApi.delete,
};

export default function AdminRolesPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<RoleFormValues>();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const editRecord = useCrudRecordDetail<AdminRole>({ load: roleApi.detail });
  const roleAuthorization = useRoleAuthorization({
    t,
    onSuccess: (content) => message.success(content),
  });
  const editing = editRecord.record;
  const open = createOpen || editRecord.open;

  useEffect(() => {
    if (!editRecord.open || !editing) {
      return;
    }

    form.setFieldsValue({
      code: editing.code,
      name: editing.name,
      sort: editing.sort,
      status: editing.status,
    });
  }, [editRecord.open, editing, form]);

  const statusText = useMemo<Record<AdminRole['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const openCreate = () => {
    editRecord.close();
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue({ sort: 0, status: 'enabled' });
  };

  const openEdit = (record: AdminRole) => {
    if (isBuiltinRole(record)) {
      return;
    }

    setCreateOpen(false);
    form.resetFields();
    void editRecord.openRecord(record.id, { initialRecord: record });
  };

  const closeForm = () => {
    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
  };

  const columns = useMemo(() => createRoleColumns({ statusText, t }), [statusText, t]);

  const filters = useMemo(() => createRoleFilters({ statusText, t }), [statusText, t]);

  const submit = async (action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>) => {
    if (isBuiltinRole(editing)) {
      return;
    }

    const values = await form.validateFields().catch(() => undefined);
    if (values === undefined) {
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await action.update?.(editing.id, values);
        message.success(t('system.roles.success.update', '角色已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.roles.success.create', '角色已创建'));
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TrueAdminCrudPage<AdminRole, AdminRolePayload, AdminRolePayload>
      title={t('system.roles.title', '角色管理')}
      description={t(
        'system.roles.description',
        '维护后台角色、功能权限和数据权限。角色是平铺的权限集合，不表达组织层级。',
      )}
      resource="system.role"
      rowKey="id"
      columns={columns}
      service={roleService}
      quickSearch={{
        placeholder: t('system.roles.quickSearch.placeholder', '搜索角色名称 / 编码'),
      }}
      filters={filters}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('system.roles.action.create', '新增角色')}
        </Button>
      }
      rowActions={{
        delete: false,
        width: 210,
        render: ({ action, record }) => (
          <RoleRowActions
            action={action}
            record={record}
            t={t}
            onEdit={openEdit}
            onAuthorize={roleAuthorization.openAuthorize}
          />
        ),
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.roles.deleteConfirm', '确认删除该角色吗？'),
        deleteSuccessMessage: t('system.roles.deleteSuccess', '角色已删除'),
        deleteText: t('crud.action.delete', '删除'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) =>
          t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{
        quickSearchInputProps: { allowClear: true },
        reloadButtonProps: { title: t('crud.action.reload', '刷新') },
      }}
      tableProps={{ size: 'middle' }}
      paginationProps={{ showQuickJumper: true }}
      tableScrollX={980}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <RoleFormModal
            editing={editing}
            form={form}
            loading={editRecord.loading}
            open={open}
            statusText={statusText}
            submitting={submitting}
            t={t}
            onCancel={closeForm}
            onSubmit={() => void submit(action)}
          />
          <RoleAuthorizeModal
            {...roleAuthorization.modalProps}
            t={t}
            onOk={() => void roleAuthorization.submitAuthorize(action)}
          />
        </>
      )}
    />
  );
}
