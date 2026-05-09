import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Select, Space, Tag, Tree, TreeSelect, Typography } from 'antd';
import type { TreeProps, TreeSelectProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudColumns, CrudFilterSchema, CrudListParams, CrudTableAction, CrudService } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { menuApi } from '../../services/menu.api';
import { roleApi } from '../../services/role.api';
import type { AdminMenu } from '../../types/menu';
import type { AdminRole, AdminRolePayload } from '../../types/role';

type RoleFormValues = AdminRolePayload;

const ROOT_PARENT_ID = 0;

const flattenRoles = (roles: AdminRole[]): AdminRole[] => roles.flatMap((role) => [role, ...flattenRoles(role.children ?? [])]);

const toPageResult = (items: AdminRole[], params: CrudListParams) => ({
  items,
  total: flattenRoles(items).length,
  page: Number(params.page ?? 1),
  pageSize: Number(params.pageSize ?? (flattenRoles(items).length || 20)),
});

const roleTreeService: CrudService<AdminRole, AdminRolePayload, AdminRolePayload> = {
  list: async (params) => toPageResult(await roleApi.tree(params), params),
  create: roleApi.create,
  update: roleApi.update,
  delete: roleApi.delete,
};

const toRoleTreeSelectData = (
  roles: AdminRole[],
  disabledId?: number,
  ancestorDisabled = false,
): TreeSelectProps['treeData'] =>
  roles.map((role) => {
    const disabled = ancestorDisabled || role.id === disabledId;
    return {
      title: role.name,
      value: role.id,
      key: role.id,
      disabled,
      children: role.children ? toRoleTreeSelectData(role.children, disabledId, disabled) : undefined,
    };
  });

const toMenuTreeData = (menus: AdminMenu[]): TreeProps['treeData'] =>
  menus.map((menu) => ({
    title: `${menu.name}${menu.permission ? ` (${menu.permission})` : ''}`,
    key: menu.id,
    children: menu.children ? toMenuTreeData(menu.children) : undefined,
  }));

export default function AdminRolesPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<RoleFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminRole>();
  const [roleTree, setRoleTree] = useState<AdminRole[]>([]);
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);
  const [authorizeOpen, setAuthorizeOpen] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizeRole, setAuthorizeRole] = useState<AdminRole>();
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);

  const statusText = useMemo<Record<AdminRole['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const loadRoleTree = async () => {
    setRoleTree(await roleApi.tree());
  };

  const loadMenuTree = async () => {
    setMenuTree(await menuApi.tree());
  };

  useEffect(() => {
    void loadRoleTree();
    void loadMenuTree();
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    form.setFieldsValue({ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' });
    setOpen(true);
  };

  const openEdit = (record: AdminRole) => {
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

  const openAuthorize = async (record: AdminRole) => {
    const detail = await roleApi.detail(record.id);
    setAuthorizeRole(detail);
    setCheckedMenuIds(detail.menuIds ?? []);
    setAuthorizeOpen(true);
  };

  const closeAuthorize = () => {
    setAuthorizeOpen(false);
    setAuthorizeRole(undefined);
    setCheckedMenuIds([]);
  };

  const columns = useMemo<CrudColumns<AdminRole>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      { title: t('system.roles.column.name', '角色名称'), dataIndex: 'name', width: 220 },
      { title: t('system.roles.column.code', '角色编码'), dataIndex: 'code', width: 220 },
      { title: t('system.roles.column.level', '层级'), dataIndex: 'level', width: 90 },
      { title: t('system.roles.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
      {
        title: t('system.roles.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => <Tag color={record.status === 'enabled' ? 'success' : 'default'}>{statusText[record.status]}</Tag>,
      },
    ],
    [statusText, t],
  );

  const filters = useMemo<CrudFilterSchema[]>(
    () => [
      {
        label: t('system.roles.column.status', '状态'),
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
    () => [{ title: t('system.common.rootNode', '根节点'), value: ROOT_PARENT_ID, key: ROOT_PARENT_ID, children: toRoleTreeSelectData(roleTree, editing?.id) }],
    [editing?.id, roleTree, t],
  );

  const menuTreeData = useMemo(() => toMenuTreeData(menuTree), [menuTree]);

  const submit = async (action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>) => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await action.update?.(editing.id, values);
        message.success(t('system.roles.success.update', '角色已保存'));
      } else {
        await action.create?.(values);
        message.success(t('system.roles.success.create', '角色已创建'));
      }
      await loadRoleTree();
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const submitAuthorize = async (action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>) => {
    if (!authorizeRole) {
      return;
    }
    setAuthorizing(true);
    try {
      await roleApi.authorizeMenus(authorizeRole.id, checkedMenuIds.map(Number));
      message.success(t('system.roles.success.authorize', '角色授权已保存'));
      action.reload();
      closeAuthorize();
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <TrueAdminCrudPage<AdminRole, AdminRolePayload, AdminRolePayload>
      title={t('system.roles.title', '角色管理')}
      description={t('system.roles.description', '维护后台角色和权限范围，角色层级仅用于管理边界。')}
      resource="system.role"
      rowKey="id"
      columns={columns}
      service={roleTreeService}
      quickSearch={{ placeholder: t('system.roles.quickSearch.placeholder', '搜索角色名称 / 编码') }}
      filters={filters}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{t('system.roles.action.create', '新增角色')}</Button>}
      rowActions={{
        width: 210,
        render: ({ record }) => (
          <Space size={4} wrap>
            <Button size="small" type="link" onClick={() => openEdit(record)}>{t('crud.action.edit', '编辑')}</Button>
            <Button size="small" type="link" icon={<SafetyCertificateOutlined />} onClick={() => void openAuthorize(record)}>{t('system.roles.action.authorize', '授权')}</Button>
          </Space>
        ),
      }}
      locale={{
        actionColumnTitle: t('crud.column.action', '操作'),
        advancedFilterText: t('crud.filter.advanced', '高级筛选'),
        deleteConfirmTitle: t('system.roles.deleteConfirm', '确认删除该角色吗？'),
        deleteSuccessMessage: t('system.roles.deleteSuccess', '角色已删除'),
        deleteText: t('crud.action.delete', '删除'),
        filterResetText: t('crud.filter.reset', '重置'),
        filterSearchText: t('crud.filter.search', '查询'),
        paginationTotalText: (total) => t('crud.pagination.total', '共 {{total}} 条').replace('{{total}}', String(total)),
        searchText: t('crud.action.search', '搜索'),
      }}
      toolbarProps={{ quickSearchInputProps: { allowClear: true }, reloadButtonProps: { title: t('crud.action.reload', '刷新') } }}
      tableProps={{ size: 'middle' }}
      paginationProps={{ showQuickJumper: true }}
      tableScrollX={980}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <TrueAdminModal destroyOnHidden confirmLoading={submitting} open={open} title={editing ? t('system.roles.modal.edit', '编辑角色') : t('system.roles.modal.create', '新增角色')} width={560} onCancel={closeForm} onOk={() => void submit(action)}>
            <Form<RoleFormValues> form={form} layout="vertical" initialValues={{ parentId: ROOT_PARENT_ID, sort: 0, status: 'enabled' }}>
              <Form.Item label={t('system.roles.form.parentId', '上级角色')} name="parentId" extra={t('system.roles.form.parentId.extra', '上级角色用于限制子角色权限范围，不表示用户归属继承。')}>
                <TreeSelect treeData={parentTreeData} treeDefaultExpandAll showSearch treeNodeFilterProp="title" />
              </Form.Item>
              <Form.Item label={t('system.roles.form.name', '角色名称')} name="name" rules={[{ required: true, message: t('system.roles.form.nameRequired', '请输入角色名称') }]}><Input maxLength={64} /></Form.Item>
              <Form.Item label={t('system.roles.form.code', '角色编码')} name="code" rules={[{ required: true, message: t('system.roles.form.codeRequired', '请输入角色编码') }]}><Input maxLength={64} /></Form.Item>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.roles.form.sort', '排序')} name="sort"><InputNumber style={{ width: 160 }} /></Form.Item>
                <Form.Item label={t('system.roles.form.status', '状态')} name="status"><Select style={{ width: 180 }} options={[{ label: statusText.enabled, value: 'enabled' }, { label: statusText.disabled, value: 'disabled' }]} /></Form.Item>
              </Space>
            </Form>
          </TrueAdminModal>
          <TrueAdminModal destroyOnHidden confirmLoading={authorizing} open={authorizeOpen} title={authorizeRole ? t('system.roles.modal.authorizeWithName', '角色授权 - {{name}}').replace('{{name}}', authorizeRole.name) : t('system.roles.modal.authorize', '角色授权')} width={680} onCancel={closeAuthorize} onOk={() => void submitAuthorize(action)}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text type="secondary">{t('system.roles.authorize.description', '勾选该角色可访问的目录、菜单和按钮权限。子角色不能超出父角色权限范围。')}</Typography.Text>
              <Tree checkable defaultExpandAll treeData={menuTreeData} checkedKeys={checkedMenuIds} onCheck={(keys) => setCheckedMenuIds(Array.isArray(keys) ? keys : keys.checked)} />
            </Space>
          </TrueAdminModal>
        </>
      )}
    />
  );
}
