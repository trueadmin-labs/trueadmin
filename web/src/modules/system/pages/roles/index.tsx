import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TrueAdminCrudPage } from '@/core/crud';
import type { CrudService, CrudTableAction } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { departmentApi } from '../../services/department.api';
import { menuApi } from '../../services/menu.api';
import { roleApi } from '../../services/role.api';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminMenu } from '../../types/menu';
import type { AdminRole, AdminRolePayload, DataPolicyMetadata } from '../../types/role';
import { RoleAuthorizeModal } from './RoleAuthorizeModal';
import { RoleFormModal } from './RoleFormModal';
import { RoleRowActions } from './RoleRowActions';
import { createRoleColumns } from './RoleTableColumns';
import {
  type DataPolicyFormValues,
  getMenuTreeKeys,
  isBuiltinRole,
  type RoleFormValues,
  toDataPolicies,
  toDataPolicyFormValues,
  toDepartmentTreeData,
  uniqueKeys,
} from './roleAuthorization';
import { createRoleFilters } from './rolePageModel';

const roleService: CrudService<AdminRole, AdminRolePayload, AdminRolePayload> = {
  list: roleApi.list,
  create: roleApi.create,
  update: roleApi.update,
  delete: roleApi.delete,
};

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

  const columns = useMemo(() => createRoleColumns({ statusText, t }), [statusText, t]);

  const filters = useMemo(() => createRoleFilters({ statusText, t }), [statusText, t]);

  const departmentTreeData = useMemo(() => toDepartmentTreeData(departmentTree), [departmentTree]);
  const menuGroupKeysMap = useMemo(
    () => new Map(menuTree.map((menu) => [menu.id, getMenuTreeKeys([menu])])),
    [menuTree],
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
          <RoleRowActions
            action={action}
            record={record}
            t={t}
            onEdit={openEdit}
            onAuthorize={openAuthorize}
          />
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
          <RoleFormModal
            editing={editing}
            form={form}
            open={open}
            statusText={statusText}
            submitting={submitting}
            t={t}
            onCancel={closeForm}
            onSubmit={() => void submit(action)}
          />
          <RoleAuthorizeModal
            authorizing={authorizing}
            authorizeLoading={authorizeLoading}
            authorizeRole={authorizeRole}
            checkedMenuIds={checkedMenuIds}
            dataPolicyForm={dataPolicyForm}
            dataPolicyMetadata={dataPolicyMetadata}
            dataPolicyScopes={dataPolicyScopes}
            departmentTreeData={departmentTreeData}
            expandedMenuIds={expandedMenuIds}
            menuGroupKeysMap={menuGroupKeysMap}
            menuTree={menuTree}
            open={authorizeOpen}
            pendingAuthorizeRole={pendingAuthorizeRole}
            setCheckedMenuIds={setCheckedMenuIds}
            setExpandedMenuIds={setExpandedMenuIds}
            setStrictMenuCheck={setStrictMenuCheck}
            strictMenuCheck={strictMenuCheck}
            t={t}
            onCancel={closeAuthorize}
            onOk={() => void submitAuthorize(action)}
            onToggleMenuGroupRoot={toggleMenuGroupRoot}
          />
        </>
      )}
    />
  );
}
