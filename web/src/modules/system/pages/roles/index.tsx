import {
  CaretDownOutlined,
  CaretUpOutlined,
  DatabaseOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { TreeProps, TreeSelectProps } from 'antd';
import {
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminConfirmAction } from '@/core/action';
import { TrueAdminCrudPage } from '@/core/crud';
import type {
  CrudColumns,
  CrudFilterSchema,
  CrudService,
  CrudTableAction,
} from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { departmentApi } from '../../services/department.api';
import { menuApi } from '../../services/menu.api';
import { roleApi } from '../../services/role.api';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminMenu } from '../../types/menu';
import type {
  AdminRole,
  AdminRoleDataPolicy,
  AdminRoleDataPolicyScope,
  AdminRolePayload,
  DataPolicyMetadata,
} from '../../types/role';

type RoleFormValues = AdminRolePayload;

type DataPolicyScopeSelection = AdminRoleDataPolicyScope | 'none';

type DepartmentSelectionValue = Array<
  | number
  | string
  | {
      value?: number | string;
      key?: number | string;
    }
>;

type DataPolicyFormValues = {
  policies: Record<string, DataPolicyScopeSelection>;
  customDepartments: Record<string, DepartmentSelectionValue>;
};

type DataPolicyItem = {
  key: string;
  resource: string;
  strategy: string;
};

const roleService: CrudService<AdminRole, AdminRolePayload, AdminRolePayload> = {
  list: roleApi.list,
  create: roleApi.create,
  update: roleApi.update,
  delete: roleApi.delete,
};

const SUPER_ADMIN_ROLE_CODE = 'super-admin';

const isBuiltinRole = (role?: Pick<AdminRole, 'builtin' | 'code'>) =>
  role?.builtin === true || role?.code === SUPER_ADMIN_ROLE_CODE;

const toggleTreeNodeCheckByTitleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget
    .closest('.ant-tree-treenode')
    ?.querySelector<HTMLElement>('.ant-tree-checkbox')
    ?.click();
};

const toMenuTreeData = (menus: AdminMenu[]): TreeProps['treeData'] =>
  menus.map((menu) => ({
    title: (
      <button
        type="button"
        className="trueadmin-role-authorize-tree-label"
        onClick={toggleTreeNodeCheckByTitleClick}
      >
        {menu.name}
      </button>
    ),
    key: menu.id,
    children: menu.children ? toMenuTreeData(menu.children) : undefined,
  }));

const toDepartmentTreeData = (departments: DepartmentTreeNode[]): TreeSelectProps['treeData'] =>
  departments.map((department) => ({
    title: department.name,
    value: department.id,
    key: department.id,
    children: department.children ? toDepartmentTreeData(department.children) : undefined,
  }));

const getMenuTreeKeys = (menus: AdminMenu[]): React.Key[] =>
  menus.flatMap((menu) => [menu.id, ...(menu.children ? getMenuTreeKeys(menu.children) : [])]);

const getMenuChildTreeKeys = (menu: AdminMenu): React.Key[] =>
  menu.children ? getMenuTreeKeys(menu.children) : [];

const uniqueKeys = (keys: React.Key[]): React.Key[] => Array.from(new Set(keys));

const mergeMenuGroupCheckedKeys = (
  checkedKeys: React.Key[],
  groupKeys: React.Key[],
  rootKey: React.Key,
  nextChildKeys: React.Key[],
): React.Key[] => {
  const groupKeySet = new Set(groupKeys);
  const outsideKeys = checkedKeys.filter((key) => !groupKeySet.has(key));
  const normalizedChildKeys = uniqueKeys(nextChildKeys);

  return uniqueKeys([
    ...outsideKeys,
    ...(normalizedChildKeys.length > 0 ? [rootKey] : []),
    ...normalizedChildKeys,
  ]);
};

const normalizeDepartmentSelection = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        const option = item as { value?: number | string; key?: number | string };
        return Number(option.value ?? option.key ?? 0);
      }

      return Number(item);
    })
    .filter((id) => Number.isInteger(id) && id > 0);

  return Array.from(new Set(ids));
};

const toDepartmentSelectionValue = (value: unknown): DepartmentSelectionValue =>
  normalizeDepartmentSelection(value).map((id) => ({ value: id, key: id }));

const dataPolicyItemKey = (resource: string, strategy: string) => `${resource}::${strategy}`;

const textOf = (
  item: { label: string; i18n?: string },
  t: (key: string, fallback?: string) => string,
) => (item.i18n ? t(item.i18n, item.label) : item.label);

const dataPolicyItems = (metadata?: DataPolicyMetadata): DataPolicyItem[] => {
  if (!metadata) {
    return [];
  }

  return metadata.resources.flatMap((resource) =>
    resource.strategies.map((strategy) => ({
      key: dataPolicyItemKey(resource.key, strategy),
      resource: resource.key,
      strategy,
    })),
  );
};

const toDataPolicyFormValues = (
  metadata: DataPolicyMetadata | undefined,
  role?: AdminRole,
): DataPolicyFormValues => {
  const policies: Record<string, DataPolicyScopeSelection> = {};
  const customDepartments: Record<string, DepartmentSelectionValue> = {};
  const rolePolicies = role?.dataPolicies ?? [];

  for (const item of dataPolicyItems(metadata)) {
    const policy = rolePolicies.find(
      (candidate) => candidate.resource === item.resource && candidate.strategy === item.strategy,
    );
    policies[item.key] = policy?.scope ?? 'none';
    customDepartments[item.key] = toDepartmentSelectionValue(policy?.config?.deptIds ?? []);
  }

  return { policies, customDepartments };
};

const toDataPolicies = (
  metadata: DataPolicyMetadata | undefined,
  values: DataPolicyFormValues,
): AdminRoleDataPolicy[] =>
  dataPolicyItems(metadata).flatMap((item, index) => {
    const scope = values.policies?.[item.key];
    if (!scope || scope === 'none') {
      return [];
    }

    return {
      resource: item.resource,
      strategy: item.strategy as AdminRoleDataPolicy['strategy'],
      effect: 'allow',
      scope,
      config:
        scope === 'custom_departments' || scope === 'custom_departments_and_children'
          ? { deptIds: normalizeDepartmentSelection(values.customDepartments?.[item.key]) }
          : {},
      status: 'enabled',
      sort: index,
    };
  });

export default function AdminRolesPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<RoleFormValues>();
  const [dataPolicyForm] = Form.useForm<DataPolicyFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminRole>();
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [dataPolicyMetadata, setDataPolicyMetadata] = useState<DataPolicyMetadata>();
  const [authorizeOpen, setAuthorizeOpen] = useState(false);
  const [authorizeLoading, setAuthorizeLoading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizeRole, setAuthorizeRole] = useState<AdminRole>();
  const [pendingAuthorizeRole, setPendingAuthorizeRole] = useState<AdminRole>();
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
  const [expandedMenuIds, setExpandedMenuIds] = useState<React.Key[]>([]);
  const [strictMenuCheck, setStrictMenuCheck] = useState(true);
  const dataPolicyScopes = Form.useWatch('policies', dataPolicyForm);

  const statusText = useMemo<Record<AdminRole['status'], string>>(
    () => ({
      disabled: t('system.common.status.disabled', '禁用'),
      enabled: t('system.common.status.enabled', '启用'),
    }),
    [t],
  );

  const loadDataPolicyMetadata = async () => {
    const metadata = await roleApi.dataPolicyMetadata();
    setDataPolicyMetadata(metadata);

    return metadata;
  };

  const openCreate = () => {
    setEditing(undefined);
    form.setFieldsValue({ sort: 0, status: 'enabled' });
    setOpen(true);
  };

  const openEdit = (record: AdminRole) => {
    if (isBuiltinRole(record)) {
      return;
    }

    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
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

  const openAuthorize = (record: AdminRole) => {
    if (isBuiltinRole(record)) {
      return;
    }

    setPendingAuthorizeRole(record);
    setAuthorizeRole(undefined);
    setCheckedMenuIds([]);
    setExpandedMenuIds([]);
    setStrictMenuCheck(true);
    dataPolicyForm.resetFields();
    setAuthorizeOpen(true);
  };

  const closeAuthorize = () => {
    setAuthorizeOpen(false);
    setAuthorizeLoading(false);
    setPendingAuthorizeRole(undefined);
    setAuthorizeRole(undefined);
    setCheckedMenuIds([]);
    setExpandedMenuIds([]);
    setStrictMenuCheck(true);
    dataPolicyForm.resetFields();
  };

  useEffect(() => {
    if (!authorizeOpen || !pendingAuthorizeRole) {
      return;
    }

    let cancelled = false;
    setAuthorizeLoading(true);

    const loadAuthorizeData = async () => {
      try {
        const [detail, metadata, menus, departments] = await Promise.all([
          roleApi.detail(pendingAuthorizeRole.id),
          dataPolicyMetadata ? Promise.resolve(dataPolicyMetadata) : loadDataPolicyMetadata(),
          menuTree.length > 0 ? Promise.resolve(menuTree) : menuApi.tree(),
          departmentTree.length > 0 ? Promise.resolve(departmentTree) : departmentApi.tree(),
        ]);

        if (cancelled) {
          return;
        }

        setMenuTree(menus);
        setDepartmentTree(departments);
        setAuthorizeRole(detail);
        setCheckedMenuIds(detail.menuIds ?? []);
        setExpandedMenuIds(getMenuTreeKeys(menus));
        dataPolicyForm.setFieldsValue(toDataPolicyFormValues(metadata, detail));
      } finally {
        if (!cancelled) {
          setAuthorizeLoading(false);
        }
      }
    };

    void loadAuthorizeData();

    return () => {
      cancelled = true;
    };
  }, [authorizeOpen, pendingAuthorizeRole]);

  const columns = useMemo<CrudColumns<AdminRole>>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 88, sorter: true },
      { title: t('system.roles.column.name', '角色名称'), dataIndex: 'name', width: 220 },
      { title: t('system.roles.column.code', '角色编码'), dataIndex: 'code', width: 220 },
      { title: t('system.roles.column.sort', '排序'), dataIndex: 'sort', width: 90, sorter: true },
      {
        title: t('system.roles.column.status', '状态'),
        dataIndex: 'status',
        width: 110,
        render: (_, record) => (
          <Tag color={record.status === 'enabled' ? 'success' : 'default'}>
            {statusText[record.status]}
          </Tag>
        ),
      },
      {
        title: t('system.roles.column.type', '类型'),
        dataIndex: 'builtin',
        width: 120,
        render: (_, record) =>
          isBuiltinRole(record) ? (
            <Tag color="gold">{t('system.roles.type.builtin', '系统内置')}</Tag>
          ) : (
            <Tag>{t('system.roles.type.custom', '自定义')}</Tag>
          ),
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

  const departmentTreeData = useMemo(() => toDepartmentTreeData(departmentTree), [departmentTree]);
  const menuGroupKeysMap = useMemo(
    () => new Map(menuTree.map((menu) => [menu.id, getMenuTreeKeys([menu])])),
    [menuTree],
  );
  const dataPolicyStrategyMap = useMemo(
    () => new Map(dataPolicyMetadata?.strategies.map((strategy) => [strategy.key, strategy]) ?? []),
    [dataPolicyMetadata],
  );

  const toggleMenuGroupRoot = (menu: AdminMenu, checked: boolean) => {
    setCheckedMenuIds((current) => {
      const withoutRoot = current.filter((key) => key !== menu.id);

      return checked ? uniqueKeys([...withoutRoot, menu.id]) : withoutRoot;
    });
  };

  const submit = async (action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>) => {
    if (isBuiltinRole(editing)) {
      return;
    }

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
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const submitAuthorize = async (
    action: CrudTableAction<AdminRole, AdminRolePayload, AdminRolePayload>,
  ) => {
    if (!authorizeRole) {
      return;
    }
    if (isBuiltinRole(authorizeRole)) {
      return;
    }

    setAuthorizing(true);
    try {
      const metadata = dataPolicyMetadata ?? (await loadDataPolicyMetadata());
      const dataPolicyValues = await dataPolicyForm.validateFields();
      await roleApi.authorize(authorizeRole.id, {
        menuIds: checkedMenuIds.map(Number),
        dataPolicies: toDataPolicies(metadata, dataPolicyValues),
      });
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
      description={t(
        'system.roles.description',
        '维护后台角色、功能权限和数据权限。角色是平铺的权限集合，不表达组织层级。',
      )}
      resource="system.role"
      rowKey="id"
      columns={columns}
      service={roleService}
      quickSearch={{
        placeholder: t('system.roles.quickSearch.placeholder', '搜索角色名称 / 编码'),
      }}
      filters={filters}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('system.roles.action.create', '新增角色')}
        </Button>
      }
      rowActions={{
        delete: false,
        width: 210,
        render: ({ action, record }) => (
          <Space size={4} wrap>
            <Button
              disabled={isBuiltinRole(record)}
              size="small"
              type="link"
              onClick={() => openEdit(record)}
            >
              {t('crud.action.edit', '编辑')}
            </Button>
            <Button
              disabled={isBuiltinRole(record)}
              size="small"
              type="link"
              icon={<SafetyCertificateOutlined />}
              onClick={() => openAuthorize(record)}
            >
              {t('system.roles.action.authorize', '授权')}
            </Button>
            <TrueAdminConfirmAction
              danger
              disabled={isBuiltinRole(record)}
              size="small"
              type="link"
              action={async () => {
                await action.delete?.(record.id);
              }}
              confirm={t('system.roles.deleteConfirm', '确认删除该角色吗？')}
              successMessage={t('system.roles.deleteSuccess', '角色已删除')}
            >
              {t('crud.action.delete', '删除')}
            </TrueAdminConfirmAction>
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
      tableScrollX={980}
      tableRender={({ action }, defaultDom) => (
        <>
          {defaultDom}
          <TrueAdminModal
            destroyOnHidden
            confirmLoading={submitting}
            open={open}
            title={
              editing
                ? t('system.roles.modal.edit', '编辑角色')
                : t('system.roles.modal.create', '新增角色')
            }
            width={560}
            onCancel={closeForm}
            onOk={() => void submit(action)}
          >
            <Form<RoleFormValues>
              form={form}
              layout="vertical"
              initialValues={{ sort: 0, status: 'enabled' }}
            >
              <Form.Item
                label={t('system.roles.form.name', '角色名称')}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t('system.roles.form.nameRequired', '请输入角色名称'),
                  },
                ]}
              >
                <Input maxLength={64} />
              </Form.Item>
              <Form.Item
                label={t('system.roles.form.code', '角色编码')}
                name="code"
                rules={[
                  {
                    required: true,
                    message: t('system.roles.form.codeRequired', '请输入角色编码'),
                  },
                ]}
              >
                <Input maxLength={64} />
              </Form.Item>
              <Space size={12} style={{ width: '100%' }} align="start">
                <Form.Item label={t('system.roles.form.sort', '排序')} name="sort">
                  <InputNumber style={{ width: 160 }} />
                </Form.Item>
                <Form.Item label={t('system.roles.form.status', '状态')} name="status">
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
          <TrueAdminModal
            destroyOnHidden
            className="trueadmin-role-authorize-modal"
            confirmLoading={authorizing}
            okButtonProps={{ disabled: authorizeLoading || !authorizeRole }}
            open={authorizeOpen}
            title={
              authorizeRole || pendingAuthorizeRole
                ? t('system.roles.modal.authorizeWithName', '角色授权 - {{name}}').replace(
                    '{{name}}',
                    (authorizeRole ?? pendingAuthorizeRole)?.name ?? '',
                  )
                : t('system.roles.modal.authorize', '角色授权')
            }
            width={820}
            styles={{ body: { height: 'min(68vh, 680px)', overflow: 'hidden' } }}
            onCancel={closeAuthorize}
            onOk={() => void submitAuthorize(action)}
          >
            <div className="trueadmin-role-authorize-body">
              <Spin spinning={authorizeLoading}>
                <Tabs
                  className="trueadmin-role-authorize-tabs"
                  items={[
                    {
                      key: 'menus',
                      label: t('system.roles.authorize.tab.menus', '功能权限'),
                      icon: <SafetyCertificateOutlined />,
                      children: (
                        <div className="trueadmin-role-authorize-pane">
                          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                            <div className="trueadmin-role-authorize-tree-toolbar">
                              <Space size={4}>
                                <Tooltip title={t('system.roles.authorize.expandAll', '展开全部')}>
                                  <Button
                                    disabled={authorizeLoading || menuTree.length === 0}
                                    icon={<CaretDownOutlined />}
                                    size="small"
                                    type="text"
                                    onClick={() => setExpandedMenuIds(getMenuTreeKeys(menuTree))}
                                  />
                                </Tooltip>
                                <Tooltip
                                  title={t('system.roles.authorize.collapseAll', '收起全部')}
                                >
                                  <Button
                                    disabled={authorizeLoading || expandedMenuIds.length === 0}
                                    icon={<CaretUpOutlined />}
                                    size="small"
                                    type="text"
                                    onClick={() => setExpandedMenuIds([])}
                                  />
                                </Tooltip>
                              </Space>
                              <Space size={8}>
                                <Typography.Text type="secondary">
                                  {t('system.roles.authorize.strictCheck', '精准勾选')}
                                </Typography.Text>
                                <Switch
                                  checked={strictMenuCheck}
                                  disabled={authorizeLoading}
                                  size="small"
                                  onChange={setStrictMenuCheck}
                                />
                              </Space>
                            </div>
                            <div className="trueadmin-menu-permission-card-list">
                              {menuTree.map((menu) => {
                                const groupKeys =
                                  menuGroupKeysMap.get(menu.id) ?? getMenuTreeKeys([menu]);
                                const childKeys = getMenuChildTreeKeys(menu);
                                const childCheckedCount = childKeys.filter((key) =>
                                  checkedMenuIds.includes(key),
                                ).length;
                                const childTreeData = toMenuTreeData(menu.children ?? []);

                                return (
                                  <Card
                                    className="trueadmin-menu-permission-card"
                                    key={menu.id}
                                    size="small"
                                    title={
                                      <Checkbox
                                        checked={checkedMenuIds.includes(menu.id)}
                                        disabled={authorizeLoading}
                                        indeterminate={
                                          !checkedMenuIds.includes(menu.id) && childCheckedCount > 0
                                        }
                                        onChange={(event) =>
                                          toggleMenuGroupRoot(menu, event.target.checked)
                                        }
                                      >
                                        {menu.name}
                                      </Checkbox>
                                    }
                                  >
                                    {childTreeData && childTreeData.length > 0 ? (
                                      <Tree
                                        checkable
                                        checkStrictly={strictMenuCheck}
                                        expandedKeys={expandedMenuIds.filter((key) =>
                                          childKeys.includes(key),
                                        )}
                                        treeData={childTreeData}
                                        checkedKeys={checkedMenuIds.filter((key) =>
                                          childKeys.includes(key),
                                        )}
                                        onCheck={(keys) => {
                                          const nextChildKeys = Array.isArray(keys)
                                            ? keys
                                            : keys.checked;
                                          setCheckedMenuIds((current) =>
                                            mergeMenuGroupCheckedKeys(
                                              current,
                                              groupKeys,
                                              menu.id,
                                              nextChildKeys,
                                            ),
                                          );
                                        }}
                                        onExpand={(keys) =>
                                          setExpandedMenuIds((current) => {
                                            const childKeySet = new Set(childKeys);
                                            return uniqueKeys([
                                              ...current.filter((key) => !childKeySet.has(key)),
                                              ...keys,
                                            ]);
                                          })
                                        }
                                      />
                                    ) : (
                                      <Typography.Text type="secondary">
                                        {t('system.roles.authorize.emptyGroup', '暂无子权限')}
                                      </Typography.Text>
                                    )}
                                  </Card>
                                );
                              })}
                            </div>
                          </Space>
                        </div>
                      ),
                    },
                    {
                      key: 'data-policy',
                      label: t('system.roles.authorize.tab.dataPolicy', '数据权限'),
                      icon: <DatabaseOutlined />,
                      children: (
                        <div className="trueadmin-role-authorize-pane">
                          <Form<DataPolicyFormValues>
                            form={dataPolicyForm}
                            layout="vertical"
                            initialValues={toDataPolicyFormValues(
                              dataPolicyMetadata,
                              authorizeRole,
                            )}
                          >
                            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                              <Typography.Text type="secondary">
                                {t(
                                  'system.roles.dataPolicy.description',
                                  '数据权限按资源单独配置。未选择的数据资源不会授予任何数据范围。',
                                )}
                              </Typography.Text>
                              <div className="trueadmin-data-policy-list">
                                {dataPolicyMetadata?.resources.map((resource) => (
                                  <Card
                                    className="trueadmin-data-policy-card"
                                    key={resource.key}
                                    size="small"
                                    title={textOf(resource, t)}
                                  >
                                    <div className="trueadmin-data-policy-card-rows">
                                      {resource.strategies.map((strategyKey) => {
                                        const strategy = dataPolicyStrategyMap.get(strategyKey);
                                        if (!strategy) {
                                          return null;
                                        }
                                        const fieldKey = dataPolicyItemKey(
                                          resource.key,
                                          strategyKey,
                                        );
                                        const scope = dataPolicyScopes?.[fieldKey];
                                        const scopeOptions = [
                                          {
                                            label: t(
                                              'system.roles.dataPolicy.scope.none',
                                              '不授权',
                                            ),
                                            value: 'none',
                                          },
                                          ...strategy.scopes.map((scopeItem) => ({
                                            label: textOf(scopeItem, t),
                                            value: scopeItem.key,
                                          })),
                                        ];

                                        return (
                                          <div className="trueadmin-data-policy-row" key={fieldKey}>
                                            <div className="trueadmin-data-policy-main-row">
                                              <Typography.Text>
                                                {textOf(strategy, t)}
                                              </Typography.Text>
                                              <Form.Item
                                                className="trueadmin-data-policy-scope-item"
                                                name={['policies', fieldKey]}
                                                rules={[]}
                                              >
                                                <Select
                                                  options={scopeOptions}
                                                  placeholder={t(
                                                    'system.roles.dataPolicy.scopePlaceholder',
                                                    '请选择权限类型',
                                                  )}
                                                />
                                              </Form.Item>
                                            </div>
                                            {scope === 'custom_departments' ||
                                            scope === 'custom_departments_and_children' ? (
                                              <div className="trueadmin-data-policy-departments-row">
                                                <Typography.Text type="secondary">
                                                  {t(
                                                    'system.roles.dataPolicy.departments',
                                                    '可见部门',
                                                  )}
                                                </Typography.Text>
                                                <Form.Item
                                                  className="trueadmin-data-policy-departments-item"
                                                  name={['customDepartments', fieldKey]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: t(
                                                        'system.roles.dataPolicy.departmentsRequired',
                                                        '请选择可见部门',
                                                      ),
                                                    },
                                                  ]}
                                                >
                                                  <TreeSelect
                                                    treeData={departmentTreeData}
                                                    treeCheckable
                                                    treeCheckStrictly
                                                    treeDefaultExpandAll
                                                    showSearch
                                                    treeNodeFilterProp="title"
                                                    placeholder={t(
                                                      'system.roles.dataPolicy.departmentsPlaceholder',
                                                      '请选择部门',
                                                    )}
                                                  />
                                                </Form.Item>
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </Space>
                          </Form>
                        </div>
                      ),
                    },
                  ]}
                />
              </Spin>
            </div>
          </TrueAdminModal>
        </>
      )}
    />
  );
}
