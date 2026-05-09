import { PlusOutlined } from '@ant-design/icons';
import type { TreeSelectProps } from 'antd';
import { App, Button, Form, Input, InputNumber, Select, Space, Tag, TreeSelect } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema, CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { departmentApi } from '../../services/department.api';
import type { DepartmentPayload, DepartmentTreeNode } from '../../types/department';

type DepartmentFormValues = DepartmentPayload;

const ROOT_PARENT_ID = 0;

const toTreeSelectData = (
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
        ? toTreeSelectData(department.children, disabledId, disabled)
        : undefined,
    };
  });

export default function AdminDepartmentsPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<DepartmentFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DepartmentTreeNode>();
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);

  const statusText = useMemo<Record<DepartmentTreeNode['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const loadDepartmentTree = async () => {
    setDepartmentTree(await departmentApi.tree());
  };

  useEffect(() => {
    void loadDepartmentTree();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.setFieldsValue({ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' });
    setOpen(true);
  };

  const openEdit = (record: DepartmentTreeNode) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      parentId: record.parentId,
      sort: record.sort,
      status: record.status,
    });
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(undefined);
    form.resetFields();
  };

  const columns = useMemo<CrudColumns<DepartmentTreeNode>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      { title: t('system.departments.column.name', '部门名称'), dataIndex: 'name', width: 220 },
      { title: t('system.departments.column.code', '部门编码'), dataIndex: 'code', width: 220 },
      { title: t('system.departments.column.level', '层级'), dataIndex: 'level', width: 90 },
      {
        title: t('system.departments.column.sort', '排序'),
        dataIndex: 'sort',
        width: 90,
        sorter: true,
      },
      {
        title: t('system.departments.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => (
          <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
            {statusText[record.status]}
          </Tag>
        ),
      },
    ],
    [statusText, t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        label: t('system.departments.column.status', '状态'),
        name: 'status',
        type: 'select',
        options: [
          { label: statusText.enabled, value: 'enabled' },
          { label: statusText.disabled, value: 'disabled' },
        ],
      },
    ],
    [statusText, t],
  );

  const parentTreeData = useMemo<TreeSelectProps['treeData']>(
    () => [
      {
        title: t('system.common.rootNode', '根节点'),
        value: ROOT_PARENT_ID,
        key: ROOT_PARENT_ID,
        children: toTreeSelectData(departmentTree, editing?.id),
      },
    ],
    [departmentTree, editing?.id, t],
  );

  const submit = async (
    action: CrudTableAction<DepartmentTreeNode, DepartmentPayload, DepartmentPayload>,
  ) => {
    const values = await form.validateFields();
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
        width: 150,
        render: ({ record }) => (
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            {t('crud.action.edit', '编辑')}
          </Button>
        ),
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
          <TrueAdminModal
            destroyOnHidden
            confirmLoading={submitting}
            open={open}
            title={
              editing
                ? t('system.departments.modal.edit', '编辑部门')
                : t('system.departments.modal.create', '新增部门')
            }
            width={560}
            onCancel={closeForm}
            onOk={() => void submit(action)}
          >
            <Form<DepartmentFormValues>
              form={form}
              layout="vertical"
              initialValues={{ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' }}
            >
              <Form.Item label={t('system.departments.form.parentId', '上级部门')} name="parentId">
                <TreeSelect
                  treeData={parentTreeData}
                  treeDefaultExpandAll
                  showSearch
                  treeNodeFilterProp="title"
                />
              </Form.Item>
              <Form.Item
                label={t('system.departments.form.name', '部门名称')}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t('system.departments.form.nameRequired', '请输入部门名称'),
                  },
                ]}
              >
                <Input maxLength={64} />
              </Form.Item>
              <Form.Item
                label={t('system.departments.form.code', '部门编码')}
                name="code"
                rules={[
                  {
                    required: true,
                    message: t('system.departments.form.codeRequired', '请输入部门编码'),
                  },
                ]}
              >
                <Input maxLength={64} />
              </Form.Item>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.departments.form.sort', '排序')} name="sort">
                  <InputNumber style={{ width: 160 }} />
                </Form.Item>
                <Form.Item label={t('system.departments.form.status', '状态')} name="status">
                  <Select
                    style={{ width: 180 }}
                    options={[
                      { label: statusText.enabled, value: 'enabled' },
                      { label: statusText.disabled, value: 'disabled' },
                    ]}
                  />
                </Form.Item>
              </Space>
            </Form>
          </TrueAdminModal>
        </>
      )}
    />
  );
}
