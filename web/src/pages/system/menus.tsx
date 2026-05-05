import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Tag, message } from 'antd';
import { useModel } from '@umijs/max';
import React, { useRef, useState } from 'react';
import {
  adminMenuList,
  createAdminMenu,
  deleteAdminMenu,
  updateAdminMenu,
  hasPermission,
} from '@/services/trueadmin';
import type { AdminMenu, AdminMenuPayload } from '@/services/trueadmin';

type MenuFormValues = AdminMenuPayload & {
  id?: number;
};

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const typeOptions = [
  { label: '目录', value: 'directory' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

const buildTree = (menus: AdminMenu[]): AdminMenu[] => {
  const nodes = new Map<number, AdminMenu>();
  menus.forEach((menu) => {
    nodes.set(menu.id, { ...menu, children: [] });
  });

  const roots: AdminMenu[] = [];
  nodes.forEach((node) => {
    const parent = nodes.get(node.parentId);
    if (parent) {
      parent.children = [...(parent.children || []), node];
      return;
    }
    roots.push(node);
  });

  const trim = (items: AdminMenu[]): AdminMenu[] =>
    items.map((item) => {
      const children = item.children ? trim(item.children) : [];
      return children.length > 0 ? { ...item, children } : { ...item, children: undefined };
    });

  return trim(roots);
};

const MenusPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<MenuFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMenu | null>(null);
  const [allMenus, setAllMenus] = useState<AdminMenu[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { initialState } = useModel('@@initialState');
  const permissions = initialState?.currentUser?.permissions;
  const canCreate = hasPermission(permissions, 'system:menu:create');
  const canUpdate = hasPermission(permissions, 'system:menu:update');
  const canDelete = hasPermission(permissions, 'system:menu:delete');

  const openCreate = (parent?: AdminMenu) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      parentId: parent?.id || 0,
      type: parent ? 'button' : 'menu',
      status: 'enabled',
      sort: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (record: AdminMenu) => {
    setEditing(record);
    form.setFieldsValue({
      parentId: record.parentId,
      type: record.type,
      code: record.code,
      name: record.name,
      path: record.path,
      component: record.component,
      icon: record.icon,
      permission: record.permission,
      sort: record.sort,
      status: record.status,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload: AdminMenuPayload = {
      parentId: values.parentId || 0,
      code: values.code || '',
      type: values.type,
      name: values.name,
      path: values.path || '',
      component: values.component || '',
      icon: values.icon || '',
      permission: values.permission || '',
      sort: values.sort || 0,
      status: values.status,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await updateAdminMenu(editing.id, payload);
        message.success('菜单已更新');
      } else {
        await createAdminMenu(payload);
        message.success('菜单已创建');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<AdminMenu>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 220,
    },
    {
      title: '编码',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
      search: false,
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      valueType: 'select',
      fieldProps: { options: typeOptions },
      render: (_, record) => {
        const color = record.type === 'button' ? 'geekblue' : record.type === 'directory' ? 'gold' : 'green';
        const label = typeOptions.find((item) => item.value === record.type)?.label || record.type;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '组件',
      dataIndex: 'component',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      search: false,
      width: 100,
    },
    {
      title: '权限码',
      dataIndex: 'permission',
      copyable: true,
      ellipsis: true,
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
            title="删除菜单"
            description={`确认删除 ${record.name} 吗？`}
            onConfirm={async () => {
              await deleteAdminMenu(record.id);
              message.success('菜单已删除');
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
    <PageContainer title="菜单管理" content="维护后台菜单、按钮权限与前端路由元信息。">
      <ProTable<AdminMenu>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params) => {
          const list = await adminMenuList({
            keyword: params.name || params.permission,
            status: params.status,
          });
          setAllMenus(list);
          return { data: buildTree(list), success: true, total: list.length };
        }}
        pagination={false}
        search={{ labelWidth: 88 }}
        toolBarRender={() =>
          canCreate
            ? [
                <Button key="create" icon={<PlusOutlined />} type="primary" onClick={() => openCreate()}>
                  新建菜单
                </Button>,
              ]
            : []
        }
      />

      <Modal
        title={editing ? '编辑菜单' : '新建菜单'}
        open={modalOpen}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        destroyOnHidden
      >
        <Form<MenuFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item label="父级" name="parentId">
            <Select
              showSearch
              optionFilterProp="label"
              options={[
                { label: '根节点', value: 0 },
                ...allMenus
                  .filter((menu) => menu.id !== editing?.id)
                  .map((menu) => ({ label: `${menu.name} (${menu.permission || menu.path || 'root'})`, value: menu.id })),
              ]}
            />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如 用户管理" />
          </Form.Item>
          <Form.Item label="编码" name="code">
            <Input placeholder="例如 system.users，用于元数据同步和前端 key" />
          </Form.Item>
          <Form.Item label="路由路径" name="path">
            <Input placeholder="例如 /system/users，按钮可留空" />
          </Form.Item>
          <Form.Item label="组件路径" name="component">
            <Input placeholder="例如 ./system/users，按钮可留空" />
          </Form.Item>
          <Form.Item label="图标" name="icon">
            <Input placeholder="例如 setting、appstore" />
          </Form.Item>
          <Form.Item label="权限码" name="permission">
            <Input placeholder="例如 system:user:list" />
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

export default MenusPage;
