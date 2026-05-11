import type { TreeProps, TreeSelectProps } from 'antd';
import type { MouseEvent } from 'react';
import type { DepartmentTreeNode } from '../../types/department';
import type { AdminMenu } from '../../types/menu';
import type {
  AdminRole,
  AdminRoleDataPolicy,
  AdminRoleDataPolicyScope,
  AdminRolePayload,
  DataPolicyMetadata,
} from '../../types/role';

export type RoleFormValues = AdminRolePayload;

export type DataPolicyScopeSelection = AdminRoleDataPolicyScope | 'none';

export type DepartmentSelectionValue = Array<
  | number
  | string
  | {
      value?: number | string;
      key?: number | string;
    }
>;

export type DataPolicyFormValues = {
  policies: Record<string, DataPolicyScopeSelection>;
  customDepartments: Record<string, DepartmentSelectionValue>;
};

type DataPolicyItem = {
  key: string;
  resource: string;
  strategy: string;
};

const SUPER_ADMIN_ROLE_CODE = 'super-admin';

export const isBuiltinRole = (role?: Pick<AdminRole, 'builtin' | 'code'>) =>
  role?.builtin === true || role?.code === SUPER_ADMIN_ROLE_CODE;

const toggleTreeNodeCheckByTitleClick = (event: MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget
    .closest('.ant-tree-treenode')
    ?.querySelector<HTMLElement>('.ant-tree-checkbox')
    ?.click();
};

export const toMenuTreeData = (menus: AdminMenu[]): TreeProps['treeData'] =>
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

export const toDepartmentTreeData = (
  departments: DepartmentTreeNode[],
): TreeSelectProps['treeData'] =>
  departments.map((department) => ({
    title: department.name,
    value: department.id,
    key: department.id,
    children: department.children ? toDepartmentTreeData(department.children) : undefined,
  }));

export const getMenuTreeKeys = (menus: AdminMenu[]): React.Key[] =>
  menus.flatMap((menu) => [menu.id, ...(menu.children ? getMenuTreeKeys(menu.children) : [])]);

export const getMenuChildTreeKeys = (menu: AdminMenu): React.Key[] =>
  menu.children ? getMenuTreeKeys(menu.children) : [];

export const uniqueKeys = (keys: React.Key[]): React.Key[] => Array.from(new Set(keys));

export const mergeMenuGroupCheckedKeys = (
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

export const normalizeDepartmentSelection = (value: unknown): number[] => {
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

export const dataPolicyItemKey = (resource: string, strategy: string) => `${resource}::${strategy}`;

export const textOf = (
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

export const toDataPolicyFormValues = (
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

export const toDataPolicies = (
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
