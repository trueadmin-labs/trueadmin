import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { departmentApi } from '../../services/department.api';
import { positionApi } from '../../services/position.api';
import { type AdminRoleOption, roleApi } from '../../services/role.api';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminPosition, AdminPositionPayload } from '../../types/position';
import { toDepartmentTreeSelectData } from '../departments/departmentPageModel';
import { PositionFormModal } from './PositionFormModal';
import { PositionMembersModal } from './PositionMembersModal';
import { createPositionColumns } from './PositionTableColumns';
import {
  createPositionFilters,
  type PositionFormValues,
  toRoleSelectOptions,
} from './positionPageModel';

export default function AdminPositionsPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<PositionFormValues>();
  const [createOpen, setCreateOpen] = useState(false);
  const [membersPosition, setMembersPosition] = useState<AdminPosition>();
  const [submitting, setSubmitting] = useState(false);
  const editRecord = useCrudRecordDetail<AdminPosition>({ load: positionApi.detail });
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const editing = editRecord.record;
  const open = createOpen || editRecord.open;

  const loadReferences = useCallback(async () => {
    const [nextDepartments, nextRoles] = await Promise.all([
      departmentApi.tree(),
      roleApi.options(),
    ]);
    setDepartmentTree(nextDepartments);
    setRoles(nextRoles);
  }, []);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    if (!editRecord.open || !editing) {
      return;
    }

    form.setFieldsValue({
      code: editing.code,
      deptId: editing.deptId,
      description: editing.description,
      isLeadership: editing.isLeadership,
      name: editing.name,
      roleIds: editing.roleIds,
      sort: editing.sort,
      status: editing.status,
      type: editing.type,
    });
  }, [editRecord.open, editing, form]);

  const statusText = useMemo<Record<AdminPosition['status'], string>>(
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
    form.setFieldsValue({ type: 'normal', sort: 0, status: 'enabled', isLeadership: false });
  };

  const openEdit = (record: AdminPosition) => {
    setCreateOpen(false);
    form.resetFields();
    void editRecord.openRecord(record.id, { initialRecord: record });
  };

  const closeForm = () => {
    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
  };

  const openMembers = (record: AdminPosition) => {
    setMembersPosition(record);
  };

  const closeMembers = () => {
    setMembersPosition(undefined);
  };

  const columns = useMemo(() => createPositionColumns({ statusText, t }), [statusText, t]);
  const filters = useMemo(() => createPositionFilters({ statusText, t }), [statusText, t]);
  const roleOptions = useMemo(() => toRoleSelectOptions(roles), [roles]);
  const treeData = useMemo(() => toDepartmentTreeSelectData(departmentTree), [departmentTree]);

  const submit = async (
    action: CrudTableAction<AdminPosition, AdminPositionPayload, AdminPositionPayload>,
  ) => {
    const values = await form.validateFields().catch(() => undefined);
    if (values === undefined) {
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await action.update?.(editing.id, values);
        message.success(t('system.positions.success.update', '岗位已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.positions.success.create', '岗位已创建'));
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TrueAdminCrudPage<AdminPosition, AdminPositionPayload, AdminPositionPayload>
      title={t('system.positions.title', '岗位管理')}
      description={t(
        'system.positions.description',
        '维护部门下的岗位，并通过岗位绑定角色权限包。',
      )}
      resource="system.position"
      rowKey="id"
      columns={columns}
      service={positionApi}
      quickSearch={{
        placeholder: t('system.positions.quickSearch.placeholder', '搜索岗位名称 / 编码'),
      }}
      filters={filters}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('system.positions.action.create', '新增岗位')}
        </Button>
      }
      rowActions={{
        presets: ['edit', 'delete'],
        maxInline: 2,
        order: ['edit', 'members', 'delete'],
        width: 190,
        overrides: {
          edit: {
            onClick: ({ record }) => openEdit(record),
          },
        },
        items: [
          {
            key: 'members',
            label: t('system.positions.action.members', '成员'),
            onClick: ({ record }) => openMembers(record),
            permission: 'system:position:update',
            size: 'small',
            type: 'link',
          },
        ],
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.positions.deleteConfirm', '确认删除该岗位吗？'),
        deleteSuccessMessage: t('system.positions.deleteSuccess', '岗位已删除'),
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
      tableScrollX={1180}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <PositionFormModal
            editing={editing}
            form={form}
            loading={editRecord.loading}
            open={open}
            roleOptions={roleOptions}
            roles={roles}
            statusText={statusText}
            submitting={submitting}
            t={t}
            treeData={treeData}
            onCancel={closeForm}
            onSubmit={() => void submit(action)}
          />
          <PositionMembersModal
            open={Boolean(membersPosition)}
            position={membersPosition}
            statusText={statusText}
            t={t}
            onCancel={closeMembers}
            onSaved={action.reload}
          />
        </>
      )}
    />
  );
}
