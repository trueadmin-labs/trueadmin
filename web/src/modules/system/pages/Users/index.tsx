import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag, message } from 'antd';
import { useModel } from '@umijs/max';
import { hasPermission } from '@/foundation/auth/permissions';
import { useModuleLocale } from '@/foundation/locale/useModuleLocale';
import React, { useEffect, useRef, useState } from 'react';
import {
  adminRoleOptions,
  adminUserPage,
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from '@/modules/system/services';
import type { AdminRole, AdminUser, AdminUserPayload } from '@/modules/system/types';

type UserFormValues = AdminUserPayload & {
  id?: number;
};

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const UsersPage: React.FC = () => {
  useModuleLocale('system');
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<UserFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [roleOptions, setRoleOptions] = useState<AdminRole[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { initialState } = useModel('@@initialState');
  const permissions = initialState?.currentUser?.permissions;
  const canCreate = hasPermission(permissions, 'system:user:create');
  const canUpdate = hasPermission(permissions, 'system:user:update');
  const canDelete = hasPermission(permissions, 'system:user:delete');

  const loadRoleOptions = async () => {
    const roles = await adminRoleOptions();
    setRoleOptions(roles);
  };

  useEffect(() => {
    void loadRoleOptions();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'enabled', roleIds: [] });
    setModalOpen(true);
  };

  const openEdit = (record: AdminUser) => {
    setEditing(record);
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      status: record.status,
      roleIds: record.roleIds,
      password: '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload: AdminUserPayload = {
      username: values.username,
      nickname: values.nickname,
      status: values.status,
      roleIds: values.roleIds || [],
    };

    if (values.password) {
      payload.password = values.password;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await updateAdminUser(editing.id, payload);
        message.success('管理员已更新');
      } else {
        await createAdminUser(payload);
        message.success('管理员已创建');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<AdminUser>[] = [
    {
      title: '账号',
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      search: false,
      render: (_, record) => (
        <Space size={[0, 6]} wrap>
          {record.roles.map((role) => (
            <Tag key={role} color={role === 'super-admin' ? 'gold' : 'blue'}>
              {role}
            </Tag>
          ))}
        </Space>
      ),
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
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        canUpdate ? (
          <Button key="edit" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
        ) : null,
        canDelete ? (
          <Popconfirm
            key="delete"
            title="删除管理员"
            description={`确认删除 ${record.username} 吗？`}
            disabled={record.id === 1}
            onConfirm={async () => {
              await deleteAdminUser(record.id);
              message.success('管理员已删除');
              actionRef.current?.reload();
            }}
          >
            <Button danger disabled={record.id === 1} type="link">
              删除
            </Button>
          </Popconfirm>
        ) : null,
      ].filter(Boolean),
    },
  ];

  return (
    <PageContainer title="管理员用户" content="维护后台管理员账号、角色归属和登录状态。">
      <ProTable<AdminUser>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params) => {
          const page = await adminUserPage({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.username,
            status: params.status,
          });

          return {
            data: page.items,
            success: true,
            total: page.total,
          };
        }}
        pagination={{ defaultPageSize: 10 }}
        search={{ labelWidth: 88 }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button key="create" icon={<PlusOutlined />} type="primary" onClick={openCreate}>
                  新建管理员
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title={editing ? '编辑管理员' : '新建管理员'}
        open={modalOpen}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnHidden
      >
        <Form<UserFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="例如 admin" />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input placeholder="用于界面展示" />
          </Form.Item>
          <Form.Item
            label={editing ? '重置密码' : '登录密码'}
            name="password"
            rules={editing ? [] : [{ required: true, message: '请输入登录密码' }]}
          >
            <Input.Password placeholder={editing ? '留空则不修改密码' : '请输入登录密码'} />
          </Form.Item>
          <Form.Item label="角色" name="roleIds">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roleOptions.map((role) => ({ label: role.name, value: role.id }))}
            />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UsersPage;
