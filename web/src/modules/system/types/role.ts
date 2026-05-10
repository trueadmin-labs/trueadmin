export type AdminRoleStatus = 'enabled' | 'disabled';

export type AdminRoleDataPolicyScope =
  | 'all'
  | 'self'
  | 'department'
  | 'department_and_children'
  | 'custom_departments';

export type AdminRoleDataPolicy = {
  id?: number;
  roleId?: number;
  resource: string;
  action: string;
  strategy: string;
  effect: 'allow';
  scope: AdminRoleDataPolicyScope;
  config?: {
    deptIds?: number[];
    [key: string]: unknown;
  };
  status?: 'enabled' | 'disabled';
  sort?: number;
};

export type DataPolicyText = {
  key: string;
  label: string;
  i18n?: string;
  sort?: number;
};

export type DataPolicyScopeMetadata = DataPolicyText & {
  configSchema?: Array<DataPolicyText & { type: string }>;
};

export type DataPolicyStrategyMetadata = DataPolicyText & {
  scopes: DataPolicyScopeMetadata[];
};

export type DataPolicyResourceMetadata = DataPolicyText & {
  actions: DataPolicyText[];
  strategies: string[];
};

export type DataPolicyMetadata = {
  resources: DataPolicyResourceMetadata[];
  strategies: DataPolicyStrategyMetadata[];
};

export type AdminRole = {
  id: number;
  code: string;
  name: string;
  sort: number;
  status: AdminRoleStatus;
  menuIds?: number[];
  dataPolicies?: AdminRoleDataPolicy[];
};

export type AdminRolePayload = {
  code: string;
  name: string;
  sort?: number;
  status?: AdminRoleStatus;
  menuIds?: number[];
  dataPolicies?: AdminRoleDataPolicy[];
};
