import { PlusOutlined } from '@ant-design/icons';
import type { TreeSelectProps } from 'antd';
import { App, Button, Form, Space } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrueAdminPermissionButton } from '@/core/auth';
import { TrueAdminCrudPage, useCrudRecordDetail } from '@/core/crud';
import type { CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { departmentApi } from '../../services/department.api';
import type { DepartmentPayload, DepartmentTreeNode } from '../../types/department';
import { DepartmentFormModal } from './DepartmentFormModal';
import { DepartmentPositionsPanel } from './DepartmentPositionsPanel';
import { createDepartmentColumns } from './DepartmentTableColumns';
import {
  createDepartmentFilters,
  type DepartmentFormValues,
  ROOT_PARENT_ID,
  toDepartmentTreeSelectData,
} from './departmentPageModel';

const findDepartmentById = (
  departments: DepartmentTreeNode[],
  id: number,
): DepartmentTreeNode | undefined => {
  for (const department of departments) {
    if (department.id === id) {
      return department;
    }
    const child = findDepartmentById(department.children ?? [], id);
    if (child) {
      return child;
    }
  }

  return undefined;
};

export default function AdminDepartmentsPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<DepartmentFormValues>();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const editRecord = useCrudRecordDetail<DepartmentTreeNode>({ load: departmentApi.detail });
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentTreeNode>();
  const editing = editRecord.record;
  const open = createOpen || editRecord.open;

  const statusText = useMemo<Record<DepartmentTreeNode['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const loadDepartmentTree = useCallback(async () => {
    const nextTree = await departmentApi.tree();
    setDepartmentTree(nextTree);
    setSelectedDepartment((current) =>
      current ? findDepartmentById(nextTree, current.id) : current,
    );
  }, []);

  useEffect(() => {
    void loadDepartmentTree();
  }, [loadDepartmentTree]);

  useEffect(() => {
    if (!editRecord.open || !editing) {
      return;
    }

    form.setFieldsValue({
      code: editing.code,
      name: editing.name,
      parentId: editing.parentId,
      sort: editing.sort,
      status: editing.status,
    });
  }, [editRecord.open, editing, form]);

  const openCreate = () => {
    editRecord.close();
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue({ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' });
  };

  const openEdit = (record: DepartmentTreeNode) => {
    setCreateOpen(false);
    form.resetFields();
    void editRecord.openRecord(record.id, { initialRecord: record });
  };

  const openPositions = (record: DepartmentTreeNode) => {
    setSelectedDepartment(record);
  };

  const closeForm = () => {
    setCreateOpen(false);
    editRecord.close();
    form.resetFields();
  };

  const columns = useMemo(() => createDepartmentColumns({ statusText, t }), [statusText, t]);

  const filters = useMemo(() => createDepartmentFilters({ statusText, t }), [statusText, t]);

  const parentTreeData = useMemo<TreeSelectProps['treeData']>(
    () => [
      {
        title: t('system.common.rootNode', '根节点'),
        value: ROOT_PARENT_ID,
        key: ROOT_PARENT_ID,
        children: toDepartmentTreeSelectData(departmentTree, editing?.id),
      },
    ],
    [departmentTree, editing?.id, t],
  );

  const submit = async (
    action: CrudTableAction<DepartmentTreeNode, DepartmentPayload, DepartmentPayload>,
  ) => {
    const values = await form.validateFields().catch(() => undefined);
    if (values === undefined) {
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await action.update?.(editing.id, values);
        message.success(t('system.departments.success.update', '部门已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.departments.success.create', '部门已创建'));
      }
      await loadDepartmentTree();
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TrueAdminCrudPage<DepartmentTreeNode, DepartmentPayload, DepartmentPayload>
      title={t('system.departments.title', '部门管理')}
      description={t(
        'system.departments.description',
        '维护后台组织架构，供管理员归属和组织筛选使用。',
      )}
      resource="system.department"
      rowKey="id"
      columns={columns}
      service={departmentApi}
      quickSearch={{
        placeholder: t('system.departments.quickSearch.placeholder', '搜索部门名称 / 编码'),
      }}
      filters={filters}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('system.departments.action.create', '新增部门')}
        </Button>
      }
      rowActions={{
        width: 190,
        render: ({ record }) => (
          <Space size={4}>
            <Button size="small" type="link" onClick={() => openEdit(record)}>
              {t('crud.action.edit', '编辑')}
            </Button>
            <TrueAdminPermissionButton
              permission="system:position:list"
              size="small"
              type="link"
              onClick={() => openPositions(record)}
            >
              {t('system.departments.positions.action.open', '岗位')}
            </TrueAdminPermissionButton>
          </Space>
        ),
      }}
      onDeleteSuccess={(_, context) => {
        if (selectedDepartment && String(selectedDepartment.id) === String(context.id)) {
          setSelectedDepartment(undefined);
        }
        void loadDepartmentTree();
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.departments.deleteConfirm', '确认删除该部门吗？'),
        deleteSuccessMessage: t('system.departments.deleteSuccess', '部门已删除'),
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
      tableScrollX={920}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <DepartmentPositionsPanel
            department={selectedDepartment}
            departmentTree={departmentTree}
            open={Boolean(selectedDepartment)}
            t={t}
            onClose={() => setSelectedDepartment(undefined)}
          />
          <DepartmentFormModal
            editing={editing}
            form={form}
            loading={editRecord.loading}
            open={open}
            parentTreeData={parentTreeData}
            statusText={statusText}
            submitting={submitting}
            t={t}
            onCancel={closeForm}
            onSubmit={() => void submit(action)}
          />
        </>
      )}
    />
  );
}
