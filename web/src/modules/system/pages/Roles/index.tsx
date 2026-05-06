import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag, Tree, message } from 'antd';
import type { TreeDataNode } from 'antd';
import { useModel } from '@umijs/max';
import { hasPermission } from '@/foundation/auth/permissions';
import { useModuleLocale } from '@/foundation/locale/useModuleLocale';
import React, { useEffect, useRef, useState } from 'react';
import {
  adminMenus,
  adminRoleDetail,
  adminRolePage,
  authorizeAdminRoleMenus,
  createAdminRole,
  deleteAdminRole,
  updateAdminRole,
} from '@/modules/system/services';
import type { AdminMenu, AdminRole, AdminRolePayload } from '@/modules/system/types';

type RoleFormValues = AdminRolePayload;

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const menuToTreeData = (menus: AdminMenu[]): TreeDataNode[] =>
  menus.map((menu) => ({
    key: menu.id,
    title: `${menu.name}${menu.permission ? `（${menu.permission}）` : ''}`,
    children: menu.children ? menuToTreeData(menu.children) : undefined,
  }));

const RolesPage: React.FC = () => {
  useModuleLocale('system');
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<RoleFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [authorizing, setAuthorizing] = useState<AdminRole | null>(null);
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { initialState } = useModel('@@initialState');
  const permissions = initialState?.currentUser?.permissions;
  const canCreate = hasPermission(permissions, 'system:role:create');
  const canUpdate = hasPermission(permissions, 'system:role:update');
  const canDelete = hasPermission(permissions, 'system:role:delete');
  const canAuthorize = hasPermission(permissions, 'system:role:authorize');

  const loadMenus = async () => {
    setMenuTree(await adminMenus());
  };

  useEffect(() => {
    void loadMenus();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'enabled' });
    setModalOpen(true);
  };

  const openEdit = (record: AdminRole) => {
    setEditing(record);
    form.setFieldsValue({ code: record.code, name: record.name, status: record.status });
    setModalOpen(true);
  };

  const openAuthorize = async (record: AdminRole) => {
    const detail = await adminRoleDetail(record.id);
    setAuthorizing(detail);
    setCheckedMenuIds(detail.menuIds || []);
    setAuthOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await updateAdminRole(editing.id, values);
        message.success('角色已更新');
      } else {
        await createAdminRole(values);
        message.success('角色已创建');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const submitAuthorize = async () => {
    if (!authorizing) return;
    setSubmitting(true);
    try {
      await authorizeAdminRoleMenus(authorizing.id, checkedMenuIds);
      message.success('角色授权已更新');
      setAuthOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<AdminRole>[] = [
    {
      title: '角色编码',
      dataIndex: 'code',
      copyable: true,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
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
        canAuthorize ? (
          <Button key="auth" type="link" onClick={() => openAuthorize(record)}>
            授权
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
            title="删除角色"
            description={`确认删除 ${record.name} 吗？`}
            disabled={record.code === 'super-admin'}
            onConfirm={async () => {
              await deleteAdminRole(record.id);
              message.success('角色已删除');
              actionRef.current?.reload();
            }}
          >
            <Button danger disabled={record.code === 'super-admin'} type="link">
              删除
            </Button>
          </Popconfirm>
        ) : null,
      ].filter(Boolean),
    },
  ];

  return (
    <PageContainer title="角色管理" content="维护后台角色，并通过菜单树授权页面与按钮权限。">
      <ProTable<AdminRole>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params) => {
          const page = await adminRolePage({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.code || params.name,
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
                  新建角色
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title={editing ? '编辑角色' : '新建角色'}
        open={modalOpen}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnHidden
      >
        <Form<RoleFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="例如 content-editor" />
          </Form.Item>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="例如 内容运营" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={authorizing ? `菜单授权：${authorizing.name}` : '菜单授权'}
        open={authOpen}
        width={720}
        confirmLoading={submitting}
        onCancel={() => setAuthOpen(false)}
        onOk={submitAuthorize}
        destroyOnHidden
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">勾选页面和按钮后，后端 PermissionMiddleware 会按权限码进行拦截。</Tag>
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedMenuIds}
            treeData={menuToTreeData(menuTree)}
            onCheck={(checked) => {
              const keys = Array.isArray(checked) ? checked : checked.checked;
              setCheckedMenuIds(keys.map((key) => Number(key)));
            }}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default RolesPage;
