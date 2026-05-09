import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Form, Input, InputNumber, Popconfirm, Select, Space, Tag, TreeSelect, Typography } from 'antd';
import type { TreeSelectProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema, CrudTableAction } from '@/core/crud/types';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { menuApi } from '../../services/menu.api';
import type { AdminMenu, AdminMenuOpenMode, AdminMenuPayload, AdminMenuSource, AdminMenuType } from '../../types/menu';

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
  const watchedType = Form.useWatch('type', form);
  const isEditingCodeMenu = editing?.source === 'code';

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
      link: t('system.menus.type.link', '链接'),
      menu: t('system.menus.type.menu', '菜单'),
    }),
    [t],
  );

  const sourceText = useMemo<Record<AdminMenuSource, string>>(
    () => ({
      code: t('system.menus.source.code', '代码定义'),
      custom: t('system.menus.source.custom', '自定义'),
    }),
    [t],
  );

  const openModeText = useMemo<Record<AdminMenuOpenMode, string>>(
    () => ({
      blank: t('system.menus.openMode.blank', '新标签页'),
      iframe: t('system.menus.openMode.iframe', '页面内嵌'),
      self: t('system.menus.openMode.self', '当前窗口'),
    }),
    [t],
  );

  const loadMenuTree = async () => {
    setMenuTree(await menuApi.tree());
  };

  useEffect(() => {
    void loadMenuTree();
  }, []);

  const openCreate = (type: Extract<AdminMenuType, 'directory' | 'link'>) => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({
      parentId: ROOT_PARENT_ID,
      sort: 0,
      status: 'enabled',
      type,
      openMode: type === 'link' ? 'blank' : undefined,
    });
    setOpen(true);
  };

  const openEdit = (record: AdminMenu) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      icon: record.icon,
      name: record.name,
      openMode: record.openMode || 'blank',
      parentId: record.parentId,
      path: record.path,
      permission: record.permission,
      sort: record.sort,
      status: record.status,
      type: record.type,
      url: record.url,
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
        render: (_, record) => <Tag color={record.type === 'button' ? 'default' : record.type === 'directory' ? 'processing' : record.type === 'link' ? 'warning' : 'success'}>{typeText[record.type]}</Tag>,
      },
      {
        title: t('system.menus.column.source', '来源'),
        dataIndex: 'source',
        width: 110,
        render: (_, record) => <Tag color={record.source === 'code' ? 'blue' : 'green'}>{sourceText[record.source]}</Tag>,
      },
      { title: t('system.menus.column.code', '编码'), dataIndex: 'code', width: 220 },
      { title: t('system.menus.column.path', '路径'), dataIndex: 'path', width: 220 },
      {
        title: t('system.menus.column.link', '链接'),
        dataIndex: 'url',
        width: 260,
        render: (_, record) => record.type === 'link' ? (
          <Space direction="vertical" size={2}>
            <Typography.Link href={record.url} target="_blank" rel="noreferrer" ellipsis style={{ maxWidth: 230 }}>{record.url}</Typography.Link>
            <Tag>{record.openMode ? openModeText[record.openMode] : '-'}</Tag>
          </Space>
        ) : '-',
      },
      { title: t('system.menus.column.permission', '权限标识'), dataIndex: 'permission', width: 220 },
      { title: t('system.menus.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
      {
        title: t('system.menus.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => <Tag color={record.status === 'enabled' ? 'success' : 'default'}>{statusText[record.status]}</Tag>,
      },
    ],
    [openModeText, sourceText, statusText, t, typeText],
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
          { label: typeText.link, value: 'link' },
          { label: typeText.button, value: 'button' },
        ],
      },
      {
        label: t('system.menus.column.source', '来源'),
        name: 'source',
        type: 'select',
        options: [
          { label: sourceText.code, value: 'code' },
          { label: sourceText.custom, value: 'custom' },
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
    [sourceText, statusText, t, typeText],
  );

  const createMenuItems = useMemo(
    () => [
      { key: 'directory', label: typeText.directory },
      { key: 'link', label: typeText.link },
    ],
    [typeText],
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
        message.success(t('system.menus.success.update', '资源已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.menus.success.create', '资源已创建'));
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
      description={t('system.menus.description', '管理后台资源树。代码资源由模块定义，自定义资源支持目录和链接。')}
      resource="system.menu"
      rowKey="id"
      columns={columns}
      service={menuApi}
      quickSearch={{ placeholder: t('system.menus.quickSearch.placeholder', '搜索名称 / 编码 / 路径 / 权限') }}
      filters={filters}
      extra={
        <Dropdown
          menu={{
            items: createMenuItems,
            onClick: ({ key }) => openCreate(key as Extract<AdminMenuType, 'directory' | 'link'>),
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>{t('system.menus.action.create', '新增资源')}</Button>
        </Dropdown>
      }
      rowActions={{
        delete: false,
        width: 150,
        render: ({ action, record }) => (
          <Space size={0}>
            <Button size="small" type="link" onClick={() => openEdit(record)}>{t('crud.action.edit', '编辑')}</Button>
            {record.source === 'custom' ? (
              <Popconfirm
                title={t('system.menus.deleteConfirm', '确认删除该资源吗？')}
                onConfirm={async () => {
                  await action.delete?.(record.id);
                  message.success(t('system.menus.deleteSuccess', '资源已删除'));
                  await loadMenuTree();
                }}
              >
                <Button danger size="small" type="link">{t('crud.action.delete', '删除')}</Button>
              </Popconfirm>
            ) : null}
          </Space>
        ),
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.menus.deleteConfirm', '确认删除该资源吗？'),
        deleteSuccessMessage: t('system.menus.deleteSuccess', '资源已删除'),
        deleteText: t('crud.action.delete', '删除'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) => t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{ quickSearchInputProps: { allowClear: true }, reloadButtonProps: { title: t('crud.action.reload', '刷新') } }}
      tableProps={{ size: 'middle' }}
      paginationProps={{ showQuickJumper: true }}
      tableScrollX={1660}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <TrueAdminModal destroyOnHidden confirmLoading={submitting} open={open} title={editing ? t('system.menus.modal.edit', '编辑资源') : t('system.menus.modal.create', '新增资源')} width={760} onCancel={closeForm} onOk={() => void submit(action)}>
            <Form<MenuFormValues> form={form} layout="vertical" initialValues={{ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled', type: 'directory' }}>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.parentId', '上级菜单')} name="parentId" style={{ flex: 1 }}>
                  <TreeSelect treeData={parentTreeData} treeDefaultExpandAll showSearch treeNodeFilterProp="title" />
                </Form.Item>
                <Form.Item label={t('system.menus.form.type', '类型')} name="type" style={{ width: 180 }}>
                  <Select disabled={Boolean(editing)} options={editing ? [{ label: typeText[editing.type], value: editing.type }] : [{ label: typeText.directory, value: 'directory' }, { label: typeText.link, value: 'link' }]} />
                </Form.Item>
              </Space>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.name', '菜单名称')} name="name" style={{ flex: 1 }} rules={[{ required: true, message: t('system.menus.form.nameRequired', '请输入菜单名称') }]}><Input maxLength={64} /></Form.Item>
                <Form.Item label={t('system.menus.form.code', '编码')} name="code" style={{ flex: 1 }}><Input disabled={isEditingCodeMenu} maxLength={128} placeholder={t('system.menus.form.code.placeholder', '留空自动生成')} /></Form.Item>
              </Space>
              {watchedType === 'link' ? (
                <Space size={12} style={{ width: '100%' }} align="start">
                  <Form.Item label={t('system.menus.form.url', '链接地址')} name="url" style={{ flex: 1 }} rules={[{ required: true, message: t('system.menus.form.urlRequired', '请输入链接地址') }, { type: 'url', message: t('system.menus.form.urlInvalid', '请输入有效链接地址') }]}><Input maxLength={1024} placeholder="https://example.com" /></Form.Item>
                  <Form.Item label={t('system.menus.form.openMode', '打开方式')} name="openMode" style={{ width: 180 }} rules={[{ required: watchedType === 'link', message: t('system.menus.form.openModeRequired', '请选择打开方式') }]}>
                    <Select options={[{ label: openModeText.blank, value: 'blank' }, { label: openModeText.self, value: 'self' }, { label: openModeText.iframe, value: 'iframe' }]} />
                  </Form.Item>
                </Space>
              ) : null}
              {isEditingCodeMenu ? (
                <Form.Item label={t('system.menus.form.path', '路由路径')} name="path"><Input disabled maxLength={255} /></Form.Item>
              ) : null}
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.menus.form.icon', '图标')} name="icon" style={{ flex: 1 }}><Input maxLength={64} placeholder="setting" /></Form.Item>
                <Form.Item label={t('system.menus.form.permission', '权限标识')} name="permission" style={{ flex: 1 }}><Input disabled={isEditingCodeMenu} maxLength={128} placeholder={watchedType === 'link' ? t('system.menus.form.permission.placeholder', '留空自动生成') : 'system:menu:list'} /></Form.Item>
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
