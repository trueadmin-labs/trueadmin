import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag, message } from 'antd';
import { useModel } from '@umijs/max';
import React, { useRef, useState } from 'react';
import {
  clientUserPage,
  createClientUser,
  deleteClientUser,
  disableClientUser,
  enableClientUser,
  hasPermission,
  updateClientUser,
} from '@/services/trueadmin';
import type { ClientUser, ClientUserPayload } from '@/services/trueadmin';

type ClientUserFormValues = ClientUserPayload & {
  id?: number;
};

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const ClientUsersPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<ClientUserFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { initialState } = useModel('@@initialState');
  const permissions = initialState?.currentUser?.permissions;
  const canCreate = hasPermission(permissions, 'system:client-user:create');
  const canUpdate = hasPermission(permissions, 'system:client-user:update');
  const canDelete = hasPermission(permissions, 'system:client-user:delete');
  const canStatus = hasPermission(permissions, 'system:client-user:status');

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'enabled', registerChannel: 'admin' });
    setModalOpen(true);
  };

  const openEdit = (record: ClientUser) => {
    setEditing(record);
    form.setFieldsValue({
      username: record.username,
      phone: record.phone,
      email: record.email,
      nickname: record.nickname,
      avatar: record.avatar,
      status: record.status,
      registerChannel: record.registerChannel,
      password: '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload: ClientUserPayload = {
      username: values.username || '',
      phone: values.phone || '',
      email: values.email || '',
      nickname: values.nickname || '',
      avatar: values.avatar || '',
      status: values.status || 'enabled',
      registerChannel: values.registerChannel || 'admin',
    };
    if (values.password) {
      payload.password = values.password;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await updateClientUser(editing.id, payload);
        message.success('用户端账号已更新');
      } else {
        await createClientUser(payload);
        message.success('用户端账号已创建');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<ClientUser>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      copyable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: '注册渠道',
      dataIndex: 'registerChannel',
      search: false,
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
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      valueType: 'dateTime',
      search: false,
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
      width: 260,
      render: (_, record) => [
        canUpdate ? (
          <Button key="edit" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
        ) : null,
        canStatus ? (
          <Button
            key="status"
            type="link"
            onClick={async () => {
              if (record.status === 'enabled') {
                await disableClientUser(record.id);
                message.success('用户端账号已禁用');
              } else {
                await enableClientUser(record.id);
                message.success('用户端账号已启用');
              }
              actionRef.current?.reload();
            }}
          >
            {record.status === 'enabled' ? '禁用' : '启用'}
          </Button>
        ) : null,
        canDelete ? (
          <Popconfirm
            key="delete"
            title="删除用户端账号"
            description={`确认删除 ${record.nickname || record.username || record.phone || record.email} 吗？`}
            onConfirm={async () => {
              await deleteClientUser(record.id);
              message.success('用户端账号已删除');
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
    <PageContainer title="用户端账号" content="维护用户端基础认证主体，业务资料由会员或客户模块扩展。">
      <ProTable<ClientUser>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params) => {
          const page = await clientUserPage({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.username || params.phone || params.email,
            status: params.status,
          });

          return { data: page.items, success: true, total: page.total };
        }}
        pagination={{ defaultPageSize: 10 }}
        search={{ labelWidth: 88 }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button key="create" icon={<PlusOutlined />} type="primary" onClick={openCreate}>
                  新建用户端账号
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title={editing ? '编辑用户端账号' : '新建用户端账号'}
        open={modalOpen}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnHidden
      >
        <Form<ClientUserFormValues> form={form} layout="vertical" preserve={false}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Tag color="blue">用户名、手机号、邮箱至少填写一个。</Tag>
          </Space>
          <Form.Item label="用户名" name="username">
            <Input placeholder="例如 client_demo" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="例如 13800000000" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="例如 client@example.com" />
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
          <Form.Item label="头像" name="avatar">
            <Input placeholder="头像 URL，可留空" />
          </Form.Item>
          <Form.Item label="注册渠道" name="registerChannel">
            <Input placeholder="例如 admin、app、wechat" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ClientUsersPage;
