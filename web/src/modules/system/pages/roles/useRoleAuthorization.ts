import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Form } from 'antd';
import { type Key, useEffect, useMemo, useState } from 'react';
import type { CrudTableAction } from '@/core/crud/types';
import { departmentApi } from '../../services/department.api';
import { menuApi } from '../../services/menu.api';
import { roleApi } from '../../services/role.api';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminMenu } from '../../types/menu';
import type { AdminRole, AdminRolePayload, DataPolicyMetadata } from '../../types/role';
import {
  type DataPolicyFormValues,
  getMenuTreeKeys,
  isBuiltinRole,
  toDataPolicies,
  toDataPolicyFormValues,
  toDepartmentTreeData,
  uniqueKeys,
} from './roleAuthorization';

type UseRoleAuthorizationOptions = {
  t: TranslateFunction;
  onSuccess: (content: string) => void;
};

export function useRoleAuthorization({ t, onSuccess }: UseRoleAuthorizationOptions) {
  const [dataPolicyForm] = Form.useForm<DataPolicyFormValues>();
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [dataPolicyMetadata, setDataPolicyMetadata] = useState<DataPolicyMetadata>();
  const [authorizeOpen, setAuthorizeOpen] = useState(false);
  const [authorizeLoading, setAuthorizeLoading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizeRole, setAuthorizeRole] = useState<AdminRole>();
  const [pendingAuthorizeRole, setPendingAuthorizeRole] = useState<AdminRole>();
  const [checkedMenuIds, setCheckedMenuIds] = useState<Key[]>([]);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Key[]>([]);
  const [strictMenuCheck, setStrictMenuCheck] = useState(true);
  const dataPolicyScopes = Form.useWatch('policies', dataPolicyForm);

  const loadDataPolicyMetadata = async () => {
    const metadata = await roleApi.dataPolicyMetadata();
    setDataPolicyMetadata(metadata);

    return metadata;
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
      onSuccess(t('system.roles.success.authorize', '角色授权已保存'));
      action.reload();
      closeAuthorize();
    } finally {
      setAuthorizing(false);
    }
  };

  return {
    modalProps: {
      authorizing,
      authorizeLoading,
      authorizeRole,
      checkedMenuIds,
      dataPolicyForm,
      dataPolicyMetadata,
      dataPolicyScopes,
      departmentTreeData,
      expandedMenuIds,
      menuGroupKeysMap,
      menuTree,
      open: authorizeOpen,
      pendingAuthorizeRole,
      setCheckedMenuIds,
      setExpandedMenuIds,
      setStrictMenuCheck,
      strictMenuCheck,
      onCancel: closeAuthorize,
      onToggleMenuGroupRoot: toggleMenuGroupRoot,
    },
    openAuthorize,
    submitAuthorize,
  };
}
