import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { menuApi } from '../../services/menu.api';
import type {
  AdminMenu,
  AdminMenuOpenMode,
  AdminMenuPayload,
  AdminMenuSource,
  AdminMenuType,
} from '../../types/menu';
import {
  getMenuIconMode,
  MenuFormModal,
  type MenuFormValues,
  type MenuIconMode,
  ROOT_PARENT_ID,
} from './MenuFormModal';
import { MenuRowActions } from './MenuRowActions';
import { createMenuColumns } from './MenuTableColumns';
import { createMenuFilters } from './menuPageModel';

export default function AdminMenusPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<MenuFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminMenu>();
  const [iconMode, setIconMode] = useState<MenuIconMode>('name');
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
    setIconMode('name');
    form.resetFields();
    form.setFieldsValue({
      parentId: ROOT_PARENT_ID,
      sort: 0,
      status: 'enabled',
      type,
      openMode: type === 'link' ? 'blank' : undefined,
      showLinkHeader: false,
    });
    setOpen(true);
  };

  const openEdit = (record: AdminMenu) => {
    setEditing(record);
    setIconMode(getMenuIconMode(record.icon));
    form.setFieldsValue({
      code: record.code,
      icon: record.icon,
      name: record.name,
      openMode: record.openMode || 'blank',
      parentId: record.parentId,
      path: record.path,
      permission: record.permission,
      showLinkHeader: record.showLinkHeader,
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
    setIconMode('name');
    form.resetFields();
  };

  const changeIconMode = (mode: MenuIconMode) => {
    setIconMode(mode);
    form.setFieldValue('icon', '');
  };

  const columns = useMemo(
    () => createMenuColumns({ openModeText, sourceText, statusText, t, typeText }),
    [openModeText, sourceText, statusText, t, typeText],
  );

  const filters = useMemo(
    () => createMenuFilters({ sourceText, statusText, t, typeText }),
    [sourceText, statusText, t, typeText],
  );

  const createMenuItems = useMemo(
    () => [
      { key: 'directory', label: typeText.directory },
      { key: 'link', label: typeText.link },
    ],
    [typeText],
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
      description={t(
        'system.menus.description',
        '管理后台资源树。代码资源由模块定义，自定义资源支持目录和链接。',
      )}
      resource="system.menu"
      rowKey="id"
      columns={columns}
      service={menuApi}
      quickSearch={{
        placeholder: t('system.menus.quickSearch.placeholder', '搜索名称 / 编码 / 路径 / 权限'),
      }}
      filters={filters}
      extra={
        <Dropdown
          menu={{
            items: createMenuItems,
            onClick: ({ key }) => openCreate(key as Extract<AdminMenuType, 'directory' | 'link'>),
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('system.menus.action.create', '新增资源')}
          </Button>
        </Dropdown>
      }
      rowActions={{
        delete: false,
        width: 150,
        render: ({ action, record }) => (
          <MenuRowActions
            action={action}
            record={record}
            t={t}
            onEdit={openEdit}
            onDeleteSuccess={async () => {
              message.success(t('system.menus.deleteSuccess', '资源已删除'));
              await loadMenuTree();
            }}
          />
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
      tableScrollX={1660}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <MenuFormModal
            editing={editing}
            form={form}
            iconMode={iconMode}
            menuTree={menuTree}
            open={open}
            openModeText={openModeText}
            statusText={statusText}
            submitting={submitting}
            t={t}
            typeText={typeText}
            onCancel={closeForm}
            onChangeIconMode={changeIconMode}
            onOk={() => void submit(action)}
          />
        </>
      )}
    />
  );
}
