import { DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { FormInstance, TreeSelectProps } from 'antd';
import { Spin, Tabs } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { TrueAdminModal } from '@/core/modal';
import type { AdminMenu } from '../../types/menu';
import type { AdminRole, DataPolicyMetadata } from '../../types/role';
import { RoleDataPolicyAuthorizationPane } from './RoleDataPolicyAuthorizationPane';
import { RoleMenuAuthorizationPane } from './RoleMenuAuthorizationPane';
import type { DataPolicyFormValues } from './roleAuthorization';

type DataPolicyStrategy = DataPolicyMetadata['strategies'][number];

type RoleAuthorizeModalProps = {
  authorizing: boolean;
  authorizeLoading: boolean;
  authorizeRole?: AdminRole;
  checkedMenuIds: React.Key[];
  dataPolicyForm: FormInstance<DataPolicyFormValues>;
  dataPolicyMetadata?: DataPolicyMetadata;
  dataPolicyScopes?: DataPolicyFormValues['policies'];
  departmentTreeData: TreeSelectProps['treeData'];
  expandedMenuIds: React.Key[];
  menuGroupKeysMap: Map<number, React.Key[]>;
  menuTree: AdminMenu[];
  open: boolean;
  pendingAuthorizeRole?: AdminRole;
  setCheckedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setExpandedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setStrictMenuCheck: (checked: boolean) => void;
  strictMenuCheck: boolean;
  t: (key: string, fallback?: string) => string;
  onCancel: () => void;
  onOk: () => void;
  onToggleMenuGroupRoot: (menu: AdminMenu, checked: boolean) => void;
};

export function RoleAuthorizeModal({
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
  open,
  pendingAuthorizeRole,
  setCheckedMenuIds,
  setExpandedMenuIds,
  setStrictMenuCheck,
  strictMenuCheck,
  t,
  onCancel,
  onOk,
  onToggleMenuGroupRoot,
}: RoleAuthorizeModalProps) {
  const dataPolicyStrategyMap = new Map<string, DataPolicyStrategy>(
    dataPolicyMetadata?.strategies.map((strategy) => [strategy.key, strategy]) ?? [],
  );

  return (
    <TrueAdminModal
      destroyOnHidden
      className="trueadmin-role-authorize-modal"
      confirmLoading={authorizing}
      okButtonProps={{ disabled: authorizeLoading || !authorizeRole }}
      open={open}
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
      onCancel={onCancel}
      onOk={onOk}
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
                  <RoleMenuAuthorizationPane
                    authorizeLoading={authorizeLoading}
                    checkedMenuIds={checkedMenuIds}
                    expandedMenuIds={expandedMenuIds}
                    menuGroupKeysMap={menuGroupKeysMap}
                    menuTree={menuTree}
                    setCheckedMenuIds={setCheckedMenuIds}
                    setExpandedMenuIds={setExpandedMenuIds}
                    setStrictMenuCheck={setStrictMenuCheck}
                    strictMenuCheck={strictMenuCheck}
                    t={t}
                    onToggleMenuGroupRoot={onToggleMenuGroupRoot}
                  />
                ),
              },
              {
                key: 'data-policy',
                label: t('system.roles.authorize.tab.dataPolicy', '数据权限'),
                icon: <DatabaseOutlined />,
                children: (
                  <RoleDataPolicyAuthorizationPane
                    authorizeRole={authorizeRole}
                    dataPolicyForm={dataPolicyForm}
                    dataPolicyMetadata={dataPolicyMetadata}
                    dataPolicyScopes={dataPolicyScopes}
                    dataPolicyStrategyMap={dataPolicyStrategyMap}
                    departmentTreeData={departmentTreeData}
                    t={t}
                  />
                ),
              },
            ]}
          />
        </Spin>
      </div>
    </TrueAdminModal>
  );
}
