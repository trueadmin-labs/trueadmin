import { PlusOutlined } from '@ant-design/icons';
import { errorCenter } from '@trueadmin/web-core/error';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { TableProps, TreeSelectProps } from 'antd';
import { App, Button, Form, Space, Table, Tag, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminPermissionButton } from '@/core/auth';
import { useCrudRecordDetail } from '@/core/crud';
import { TrueAdminModal } from '@/core/modal';
import { positionApi } from '../../services/position.api';
import { type AdminRoleOption, roleApi } from '../../services/role.api';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminPosition, AdminPositionPayload } from '../../types/position';
import { PositionFormModal } from '../positions/PositionFormModal';
import { PositionMembersModal } from '../positions/PositionMembersModal';
import { createPositionColumns } from '../positions/PositionTableColumns';
import { type PositionFormValues, toRoleSelectOptions } from '../positions/positionPageModel';
import { toDepartmentTreeSelectData } from './departmentPageModel';

type DepartmentPositionsPanelProps = {
  department?: DepartmentTreeNode;
  departmentTree: DepartmentTreeNode[];
  open: boolean;
  t: TranslateFunction;
  onClose: () => void;
};

const DEFAULT_PAGE_SIZE = 8;

export function DepartmentPositionsPanel({
  department,
  departmentTree,
  open,
  t,
  onClose,
}: DepartmentPositionsPanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PositionFormValues>();
  const [items, setItems] = useState<AdminPosition[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [membersPosition, setMembersPosition] = useState<AdminPosition>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const {
    close: closeEditRecord,
    loading: editLoading,
    open: editOpen,
    openRecord,
    record: editing,
  } = useCrudRecordDetail<AdminPosition>({ load: positionApi.detail });
  const departmentId = department?.id;
  const formOpen = createOpen || editOpen;

  const statusText = useMemo<Record<AdminPosition['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const loadRoles = useCallback(async () => {
    setRoles(await roleApi.options());
  }, []);

  const loadPositions = useCallback(async () => {
    if (!open || !departmentId) {
      setItems([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const response = await positionApi.list(
        {
          page,
          pageSize,
          filters: [{ field: 'deptId', op: 'eq', value: departmentId }],
          sorts: [
            { field: 'sort', order: 'asc' },
            { field: 'id', order: 'asc' },
          ],
        },
        { force: true },
      );
      setItems(response.items);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  }, [departmentId, open, page, pageSize]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (!departmentId) {
      setItems([]);
      setTotal(0);
    }
    setCreateOpen(false);
    setMembersPosition(undefined);
    setPage(1);
    form.resetFields();
    closeEditRecord();
  }, [departmentId, closeEditRecord, form]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    if (!editOpen || !editing) {
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
  }, [editOpen, editing, form]);

  const treeData = useMemo<TreeSelectProps['treeData']>(
    () => toDepartmentTreeSelectData(departmentTree),
    [departmentTree],
  );
  const roleOptions = useMemo(() => toRoleSelectOptions(roles), [roles]);

  const openCreate = () => {
    if (!departmentId) {
      return;
    }

    closeEditRecord();
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue({
      deptId: departmentId,
      type: 'normal',
      sort: 0,
      status: 'enabled',
      isLeadership: false,
    });
  };

  const openEdit = useCallback(
    (record: AdminPosition) => {
      setCreateOpen(false);
      form.resetFields();
      void openRecord(record.id, { initialRecord: record });
    },
    [form, openRecord],
  );

  const closeForm = () => {
    setCreateOpen(false);
    closeEditRecord();
    form.resetFields();
  };

  const submit = async () => {
    if (!departmentId) {
      return;
    }

    const values = await form.validateFields().catch(() => undefined);
    if (values === undefined) {
      return;
    }

    const payload: AdminPositionPayload = { ...values, deptId: departmentId };
    setSubmitting(true);
    try {
      if (editing) {
        await positionApi.update(editing.id, payload);
        message.success(t('system.positions.success.update', '岗位已保存'));
      } else {
        await positionApi.create(payload);
        message.success(t('system.positions.success.create', '岗位已创建'));
      }
      await loadPositions();
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const deletePosition = useCallback(
    async (record: AdminPosition) => {
      try {
        await positionApi.delete(record.id);
        message.success(t('system.positions.deleteSuccess', '岗位已删除'));
        await loadPositions();
      } catch (error) {
        errorCenter.emit(error);
      }
    },
    [loadPositions, message, t],
  );

  const baseColumns = useMemo(
    () =>
      createPositionColumns({
        showDepartment: false,
        showId: false,
        sortable: false,
        statusText,
        t,
      }),
    [statusText, t],
  );

  const columns = useMemo<TableProps<AdminPosition>['columns']>(
    () => [
      ...baseColumns,
      {
        title: t('crud.column.action', '操作'),
        key: '__actions',
        fixed: 'right',
        width: 190,
        render: (_, record) => (
          <Space size={4}>
            <TrueAdminPermissionButton
              permission="system:position:update"
              size="small"
              type="link"
              onClick={() => openEdit(record)}
            >
              {t('crud.action.edit', '编辑')}
            </TrueAdminPermissionButton>
            <TrueAdminPermissionButton
              permission="system:position:update"
              size="small"
              type="link"
              onClick={() => setMembersPosition(record)}
            >
              {t('system.positions.action.members', '成员')}
            </TrueAdminPermissionButton>
            <TrueAdminPermissionButton
              danger
              confirm={{
                title: t('system.positions.deleteConfirm', '确认删除该岗位吗？'),
                onConfirm: () => void deletePosition(record),
              }}
              permission="system:position:delete"
              size="small"
              type="link"
            >
              {t('crud.action.delete', '删除')}
            </TrueAdminPermissionButton>
          </Space>
        ),
      },
    ],
    [baseColumns, deletePosition, openEdit, t],
  );

  return (
    <>
      <TrueAdminModal
        destroyOnHidden
        open={open}
        title={
          department
            ? `${t('system.departments.positions.title', '部门岗位')} - ${department.name}`
            : t('system.departments.positions.title', '部门岗位')
        }
        width={1040}
        headerActions={
          department ? (
            <TrueAdminPermissionButton
              icon={<PlusOutlined />}
              permission="system:position:create"
              size="small"
              type="primary"
              onClick={openCreate}
            >
              {t('system.departments.positions.action.create', '新增岗位')}
            </TrueAdminPermissionButton>
          ) : null
        }
        footer={<Button onClick={onClose}>{t('modal.action.close', '关闭')}</Button>}
        onCancel={onClose}
      >
        {department ? (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap size={8}>
              <Typography.Text type="secondary">{department.code}</Typography.Text>
              <Tag>
                {t('system.departments.positions.count', '{{count}} 个岗位').replace(
                  '{{count}}',
                  String(total),
                )}
              </Tag>
            </Space>
            <Table<AdminPosition>
              rowKey="id"
              columns={columns}
              dataSource={items}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                showSizeChanger: true,
                showTotal: (nextTotal) =>
                  t('crud.pagination.total', '共 {{total}} 条').replace(
                    '{{total}}',
                    String(nextTotal),
                  ),
                total,
              }}
              scroll={{ x: 900 }}
              size="middle"
              onChange={(pagination) => {
                setPage(pagination.current ?? 1);
                setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
              }}
            />
          </Space>
        ) : null}
      </TrueAdminModal>
      <PositionFormModal
        departmentSelectDisabled
        editing={editing}
        form={form}
        loading={editLoading}
        open={formOpen}
        roleOptions={roleOptions}
        roles={roles}
        statusText={statusText}
        submitting={submitting}
        t={t}
        treeData={treeData}
        onCancel={closeForm}
        onSubmit={() => void submit()}
      />
      <PositionMembersModal
        open={Boolean(membersPosition)}
        position={membersPosition}
        statusText={statusText}
        t={t}
        onCancel={() => setMembersPosition(undefined)}
        onSaved={() => void loadPositions()}
      />
    </>
  );
}
