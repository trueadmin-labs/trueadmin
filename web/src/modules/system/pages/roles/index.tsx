import { DatabaseOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { TreeProps } from 'antd';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Tabs,
  Tag,
  Tree,
  TreeSelect,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
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

type DataPolicyFormValues = {
  policies: Record<string, AdminRoleDataPolicyScope>;
  customDepartments: Record<string, number[]>;
};

type DataPolicyItem = {
  key: string;
  resource: string;
  action: string;
  strategy: string;
};

const roleService: CrudService<AdminRole, AdminRolePayload, AdminRolePayload> = {
  list: roleApi.list,
  create: roleApi.create,
  update: roleApi.update,
  delete: roleApi.delete,
};

const toMenuTreeData = (menus: AdminMenu[]): TreeProps['treeData'] =>
  menus.map((menu) => ({
    title: `${menu.name}${menu.permission ? ` (${menu.permission})` : ''}`,
    key: menu.id,
    children: menu.children ? toMenuTreeData(menu.children) : undefined,
  }));

const toDepartmentTreeData = (departments: DepartmentTreeNode[]): TreeProps['treeData'] =>
  departments.map((department) => ({
    title: department.name,
    key: department.id,
    children: department.children ? toDepartmentTreeData(department.children) : undefined,
  }));

const dataPolicyItemKey = (resource: string, action: string, strategy: string) =>
  `${resource}::${action}::${strategy}`;

const textOf = (
  item: { label: string; i18n?: string },
  t: (key: string, fallback?: string) => string,
) => (item.i18n ? t(item.i18n, item.label) : item.label);

const dataPolicyItems = (metadata?: DataPolicyMetadata): DataPolicyItem[] => {
  if (!metadata) {
    return [];
  }

  return metadata.resources.flatMap((resource) =>
    resource.actions.flatMap((action) =>
      resource.strategies.map((strategy) => ({
        key: dataPolicyItemKey(resource.key, action.key, strategy),
        resource: resource.key,
        action: action.key,
        strategy,
      })),
    ),
  );
};

const toDataPolicyFormValues = (
  metadata: DataPolicyMetadata | undefined,
  role?: AdminRole,
): DataPolicyFormValues => {
  const policies: Record<string, AdminRoleDataPolicyScope> = {};
  const customDepartments: Record<string, number[]> = {};
  const rolePolicies = role?.dataPolicies ?? [];

  for (const item of dataPolicyItems(metadata)) {
    const policy = rolePolicies.find(
      (candidate) =>
        candidate.resource === item.resource &&
        candidate.action === item.action &&
        candidate.strategy === item.strategy,
    );
    policies[item.key] = policy?.scope ?? 'self';
    customDepartments[item.key] = policy?.config?.deptIds ?? [];
  }

  return { policies, customDepartments };
};

const toDataPolicies = (
  metadata: DataPolicyMetadata | undefined,
  values: DataPolicyFormValues,
): AdminRoleDataPolicy[] =>
  dataPolicyItems(metadata).map((item, index) => {
    const scope = values.policies?.[item.key] ?? 'self';
    return {
      resource: item.resource,
      action: item.action,
      strategy: item.strategy as AdminRoleDataPolicy['strategy'],
      effect: 'allow',
      scope,
      config:
        scope === 'custom_departments'
          ? { deptIds: values.customDepartments?.[item.key] ?? [] }
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
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizeRole, setAuthorizeRole] = useState<AdminRole>();
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
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

  const openAuthorize = async (record: AdminRole) => {
    const [detail, metadata, menus, departments] = await Promise.all([
      roleApi.detail(record.id),
      dataPolicyMetadata ? Promise.resolve(dataPolicyMetadata) : loadDataPolicyMetadata(),
      menuTree.length > 0 ? Promise.resolve(menuTree) : menuApi.tree(),
      departmentTree.length > 0 ? Promise.resolve(departmentTree) : departmentApi.tree(),
    ]);
    setMenuTree(menus);
    setDepartmentTree(departments);
    setAuthorizeRole(detail);
    setCheckedMenuIds(detail.menuIds ?? []);
    dataPolicyForm.setFieldsValue(toDataPolicyFormValues(metadata, detail));
    setAuthorizeOpen(true);
  };

  const closeAuthorize = () => {
    setAuthorizeOpen(false);
    setAuthorizeRole(undefined);
    setCheckedMenuIds([]);
    dataPolicyForm.resetFields();
  };

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

  const menuTreeData = useMemo(() => toMenuTreeData(menuTree), [menuTree]);
  const departmentTreeData = useMemo(() => toDepartmentTreeData(departmentTree), [departmentTree]);
  const dataPolicyStrategyMap = useMemo(
    () => new Map(dataPolicyMetadata?.strategies.map((strategy) => [strategy.key, strategy]) ?? []),
    [dataPolicyMetadata],
  );

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
        width: 210,
        render: ({ record }) => (
          <Space size={4} wrap>
            <Button size="small" type="link" onClick={() => openEdit(record)}>
              {t('crud.action.edit', '编辑')}
            </Button>
            <Button
              size="small"
              type="link"
              icon={<SafetyCertificateOutlined />}
              onClick={() => void openAuthorize(record)}
            >
              {t('system.roles.action.authorize', '授权')}
            </Button>
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
            confirmLoading={authorizing}
            open={authorizeOpen}
            title={
              authorizeRole
                ? t('system.roles.modal.authorizeWithName', '角色授权 - {{name}}').replace(
                    '{{name}}',
                    authorizeRole.name,
                  )
                : t('system.roles.modal.authorize', '角色授权')
            }
            width={760}
            onCancel={closeAuthorize}
            onOk={() => void submitAuthorize(action)}
          >
            <Tabs
              items={[
                {
                  key: 'menus',
                  label: t('system.roles.authorize.tab.menus', '功能权限'),
                  icon: <SafetyCertificateOutlined />,
                  children: (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Typography.Text type="secondary">
                        {t(
                          'system.roles.authorize.description',
                          '勾选该角色可访问的目录、菜单和按钮权限。角色之间不继承权限。',
                        )}
                      </Typography.Text>
                      <Tree
                        checkable
                        defaultExpandAll
                        treeData={menuTreeData}
                        checkedKeys={checkedMenuIds}
                        onCheck={(keys) =>
                          setCheckedMenuIds(Array.isArray(keys) ? keys : keys.checked)
                        }
                      />
                    </Space>
                  ),
                },
                {
                  key: 'data-policy',
                  label: t('system.roles.authorize.tab.dataPolicy', '数据权限'),
                  icon: <DatabaseOutlined />,
                  children: (
                    <Form<DataPolicyFormValues>
                      form={dataPolicyForm}
                      layout="vertical"
                      initialValues={toDataPolicyFormValues(dataPolicyMetadata, authorizeRole)}
                    >
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Typography.Text type="secondary">
                          {t(
                            'system.roles.dataPolicy.description',
                            '数据权限按资源单独配置。模块必须先注册资源，角色授权时才能选择对应策略。',
                          )}
                        </Typography.Text>
                        {dataPolicyMetadata?.resources.map((resource) => (
                          <div key={resource.key}>
                            <Typography.Title level={5} style={{ marginTop: 0 }}>
                              {textOf(resource, t)}
                            </Typography.Title>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                              {resource.actions.flatMap((action) =>
                                resource.strategies.map((strategyKey) => {
                                  const strategy = dataPolicyStrategyMap.get(strategyKey);
                                  if (!strategy) {
                                    return null;
                                  }
                                  const fieldKey = dataPolicyItemKey(
                                    resource.key,
                                    action.key,
                                    strategyKey,
                                  );
                                  const scope = dataPolicyScopes?.[fieldKey];

                                  return (
                                    <div key={fieldKey}>
                                      <Form.Item
                                        label={`${textOf(action, t)} / ${textOf(strategy, t)}`}
                                        name={['policies', fieldKey]}
                                        rules={[
                                          {
                                            required: true,
                                            message: t(
                                              'system.roles.dataPolicy.scopeRequired',
                                              '请选择数据范围',
                                            ),
                                          },
                                        ]}
                                      >
                                        <Radio.Group>
                                          <Space wrap>
                                            {strategy.scopes.map((scopeItem) => (
                                              <Radio key={scopeItem.key} value={scopeItem.key}>
                                                {textOf(scopeItem, t)}
                                              </Radio>
                                            ))}
                                          </Space>
                                        </Radio.Group>
                                      </Form.Item>
                                      {scope === 'custom_departments' ? (
                                        <Form.Item
                                          label={t(
                                            'system.roles.dataPolicy.departments',
                                            '可见部门',
                                          )}
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
                                            treeDefaultExpandAll
                                            showSearch
                                            treeNodeFilterProp="title"
                                            placeholder={t(
                                              'system.roles.dataPolicy.departmentsPlaceholder',
                                              '请选择部门',
                                            )}
                                          />
                                        </Form.Item>
                                      ) : null}
                                    </div>
                                  );
                                }),
                              )}
                            </Space>
                          </div>
                        ))}
                      </Space>
                    </Form>
                  ),
                },
              ]}
            />
          </TrueAdminModal>
        </>
      )}
    />
  );
}
