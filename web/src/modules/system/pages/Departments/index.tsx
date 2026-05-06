import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Tag, message } from 'antd';
import { useModel } from '@umijs/max';
import { hasPermission } from '@/foundation/auth/permissions';
import { useModuleLocale } from '@/locales/useModuleLocale';
import React, { useRef, useState } from 'react';
import {
  adminDepartmentList,
  createAdminDepartment,
  deleteAdminDepartment,
  updateAdminDepartment,
} from '@/modules/system/services';
import type { AdminDepartment, AdminDepartmentPayload } from '@/modules/system/types';

type DepartmentFormValues = AdminDepartmentPayload & {
  id?: number;
};

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const flattenDepartments = (items: AdminDepartment[]): AdminDepartment[] =>
  items.flatMap((item) => [item, ...flattenDepartments(item.children || [])]);

const DepartmentsPage: React.FC = () => {
  useModuleLocale('system');
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<DepartmentFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDepartment | null>(null);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { initialState } = useModel('@@initialState');
  const permissions = initialState?.currentUser?.permissions;
  const canCreate = hasPermission(permissions, 'system:department:create');
  const canUpdate = hasPermission(permissions, 'system:department:update');
  const canDelete = hasPermission(permissions, 'system:department:delete');

  const openCreate = (parent?: AdminDepartment) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parent?.id || 0, status: 'enabled', sort: 0 });
    setModalOpen(true);
  };

  const openEdit = (record: AdminDepartment) => {
    setEditing(record);
    form.setFieldsValue({
      parentId: record.parentId,
      code: record.code,
      name: record.name,
      sort: record.sort,
      status: record.status,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload: AdminDepartmentPayload = {
      parentId: values.parentId || 0,
      code: values.code,
      name: values.name,
      sort: values.sort || 0,
      status: values.status || 'enabled',
    };

    setSubmitting(true);
    try {
      if (editing) {
        await updateAdminDepartment(editing.id, payload);
        message.success('部门已更新');
      } else {
        await createAdminDepartment(payload);
        message.success('部门已创建');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<AdminDepartment>[] = [
    {
      title: '部门名称',
      dataIndex: 'name',
      width: 220,
    },
    {
      title: '部门编码',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '层级',
      dataIndex: 'level',
      search: false,
      width: 80,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      search: false,
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: { options: statusOptions },
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'green' : 'red'}>
          {record.status === 'enabled' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        canCreate ? (
          <Button key="child" type="link" onClick={() => openCreate(record)}>
            新增子级
          </Button>
        ) : null,
        canUpdate ? (
          <Button key="edit" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
        ) : null,
        canDelete ? (
          <Popconfirm
            key="delete"
            title="删除部门"
            description={`确认删除 ${record.name} 吗？`}
            onConfirm={async () => {
              await deleteAdminDepartment(record.id);
              message.success('部门已删除');
              actionRef.current?.reload();
            }}
          >
            <Button danger type="link">
              删除
            </Button>
          </Popconfirm>
        ) : null,
      ].filter(Boolean),
    },
  ];

  return (
    <PageContainer title="部门管理" content="维护后台组织部门树，作为管理员主部门与数据权限基础。">
      <ProTable<AdminDepartment>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params) => {
          const list = await adminDepartmentList({
            keyword: params.name || params.code,
            status: params.status,
          });
          setDepartments(list);
          return { data: list, success: true, total: flattenDepartments(list).length };
        }}
        pagination={false}
        search={{ labelWidth: 88 }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button key="create" icon={<PlusOutlined />} type="primary" onClick={() => openCreate()}>
                  新建部门
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title={editing ? '编辑部门' : '新建部门'}
        open={modalOpen}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnHidden
      >
        <Form<DepartmentFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item label="父级部门" name="parentId">
            <Select
              showSearch
              optionFilterProp="label"
              options={[
                { label: '根节点', value: 0 },
                ...flattenDepartments(departments)
                  .filter((department) => department.id !== editing?.id)
                  .map((department) => ({ label: `${department.name} (${department.code})`, value: department.id })),
              ]}
            />
          </Form.Item>
          <Form.Item label="部门编码" name="code" rules={[{ required: true, message: '请输入部门编码' }]}>
            <Input placeholder="例如 headquarters" />
          </Form.Item>
          <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="例如 总部" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DepartmentsPage;
