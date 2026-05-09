import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Select, Space, Tag, TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema, CrudTableAction } from '@/core/crud/types';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { menuApi } from '../../services/menu.api';
import type { AdminMenu, AdminMenuPayload, AdminMenuType } from '../../types/menu';

type MenuFormValues = AdminMenuPayload;

const ROOT_PARENT_ID = 0;

const toTreeSelectData = (
  menus: AdminMenu[],
  disabledId?: number,
  ancestorDisabled = false,
): TreeSelectProps['treeData'] =>
  menus.map((menu) => {
    const disabled = ancestorDisabled || menu.id === disabledId;
    return {
      title: menu.name,
      value: menu.id,
      key: menu.id,
      disabled,
      children: menu.children ? toTreeSelectData(menu.children, disabledId, disabled) : undefined,
    };
  });

export default function AdminMenusPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<MenuFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminMenu>();
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);

  const statusText = useMemo<Record<AdminMenu['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const typeText = useMemo<Record<AdminMenuType, string>>(
    () => ({
      button: t('system.menus.type.button', '按钮'),
      directory: t('system.menus.type.directory', '目录'),
      menu: t('system.menus.type.menu', '菜单'),
    }),
    [t],
  );

  const loadMenuTree = async () => {
    setMenuTree(await menuApi.tree());
  };

  useEffect(() => {
    void loadMenuTree();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.setFieldsValue({ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled', type: 'menu' });
    setOpen(true);
  };

  const openEdit = (record: AdminMenu) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      icon: record.icon,
      name: record.name,
      parentId: record.parentId,
      path: record.path,
      permission: record.permission,
      sort: record.sort,
      status: record.status,
      type: record.type,
    });
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(undefined);
    form.resetFields();
  };

  const columns = useMemo<CrudColumns<AdminMenu>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      {
        title: t('system.menus.column.name', '菜单名称'),
        dataIndex: 'name',
        width: 240,
        render: (_, record) => (
          <Space size={8}>
            <span className="trueadmin-system-menu-icon"><IconRenderer name={record.icon || record.code} /></span>
            <span>{record.name}</span>
          </Space>
        ),
      },
      {
        title: t('system.menus.column.type', '类型'),
        dataIndex: 'type',
        width: 100,
        render: (_, record) => <Tag color={record.type === 'button' ? 'default' : record.type === 'directory' ? 'processing' : 'success'}>{typeText[record.type]}</Tag>,
      },
      { title: t('system.menus.column.code', '编码'), dataIndex: 'code', width: 220 },
      { title: t('system.menus.column.path', '路径'), dataIndex: 'path', width: 220 },
      { title: t('system.menus.column.permission', '权限标识'), dataIndex: 'permission', width: 220 },
      { title: t('system.menus.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
      {
        title: t('system.menus.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => <Tag color={record.status === 'enabled' ? 'success' : 'default'}>{statusText[record.status]}</Tag>,
      },
    ],
    [statusText, t, typeText],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        label: t('system.menus.column.type', '类型'),
        name: 'type',
        type: 'select',
        options: [
          { label: typeText.directory, value: 'directory' },
          { label: typeText.menu, value: 'menu' },
          { label: typeText.button, value: 'button' },
        ],
      },
      {
        label: t('system.menus.column.status', '状态'),
        name: 'status',
        type: 'select',
        options: [
          { label: statusText.enabled, value: 'enabled' },
          { label: statusText.disabled, value: 'disabled' },
        ],
      },
    ],
    [statusText, t, typeText],
  );

  const parentTreeData = useMemo<TreeSelectProps['treeData']>(
    () => [{ title: t('system.common.rootNode', '根节点'), value: ROOT_PARENT_ID, key: ROOT_PARENT_ID, children: toTreeSelectData(menuTree, editing?.id) }],
    [editing?.id, menuTree, t],
  );

  const submit = async (action: CrudTableAction<AdminMenu, AdminMenuPayload, AdminMenuPayload>) => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await action.update?.(editing.id, values);
        message.success(t('system.menus.success.update', '菜单已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.menus.success.create', '菜单已创建'));
      }
      await loadMenuTree();
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TrueAdminCrudPage<AdminMenu, AdminMenuPayload, AdminMenuPayload>
      title={t('system.menus.title', '菜单管理')}
      description={t('system.menus.description', '维护后台菜单、路由入口和按钮权限点。')}
      resource="system.menu"
      rowKey="id"
      columns={columns}
      service={menuApi}
      quickSearch={{ placeholder: t('system.menus.quickSearch.placeholder', '搜索名称 / 编码 / 路径 / 权限') }}
      filters={filters}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{t('system.menus.action.create', '新增菜单')}</Button>}
      rowActions={{
        width: 150,
        render: ({ record }) => <Button size="small" type="link" onClick={() => openEdit(record)}>{t('crud.action.edit', '编辑')}</Button>,
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.menus.deleteConfirm', '确认删除该菜单吗？'),
        deleteSuccessMessage: t('system.menus.deleteSuccess', '菜单已删除'),
        deleteText: t('crud.action.delete', '删除'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) => t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{ quickSearchInputProps: { allowClear: true }, reloadButtonProps: { title: t('crud.action.reload', '刷新') } }}
      tableProps={{ size: 'middle' }}
      paginationProps={{ showQuickJumper: true }}
      tableScrollX={1380}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <TrueAdminModal destroyOnHidden confirmLoading={submitting} open={open} title={editing ? t('system.menus.modal.edit', '编辑菜单') : t('system.menus.modal.create', '新增菜单')} width={720} onCancel={closeForm} onOk={() => void submit(action)}>
            <Form<MenuFormValues> form={form} layout="vertical" initialValues={{ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled', type: 'menu' }}>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.parentId', '上级菜单')} name="parentId" style={{ flex: 1 }}>
                  <TreeSelect treeData={parentTreeData} treeDefaultExpandAll showSearch treeNodeFilterProp="title" />
                </Form.Item>
                <Form.Item label={t('system.menus.form.type', '类型')} name="type" style={{ width: 180 }}>
                  <Select options={[{ label: typeText.directory, value: 'directory' }, { label: typeText.menu, value: 'menu' }, { label: typeText.button, value: 'button' }]} />
                </Form.Item>
              </Space>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.name', '菜单名称')} name="name" style={{ flex: 1 }} rules={[{ required: true, message: t('system.menus.form.nameRequired', '请输入菜单名称') }]}><Input maxLength={64} /></Form.Item>
                <Form.Item label={t('system.menus.form.code', '编码')} name="code" style={{ flex: 1 }}><Input maxLength={128} /></Form.Item>
              </Space>
              <Form.Item label={t('system.menus.form.path', '路由路径')} name="path"><Input maxLength={255} /></Form.Item>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.icon', '图标')} name="icon" style={{ flex: 1 }}><Input maxLength={64} placeholder="setting" /></Form.Item>
                <Form.Item label={t('system.menus.form.permission', '权限标识')} name="permission" style={{ flex: 1 }}><Input maxLength={128} placeholder="system:menu:list" /></Form.Item>
              </Space>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.sort', '排序')} name="sort"><InputNumber style={{ width: 160 }} /></Form.Item>
                <Form.Item label={t('system.menus.form.status', '状态')} name="status"><Select style={{ width: 180 }} options={[{ label: statusText.enabled, value: 'enabled' }, { label: statusText.disabled, value: 'disabled' }]} /></Form.Item>
              </Space>
            </Form>
          </TrueAdminModal>
        </>
      )}
    />
  );
}
