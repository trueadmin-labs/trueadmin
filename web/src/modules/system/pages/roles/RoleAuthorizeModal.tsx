import {
  CaretDownOutlined,
  CaretUpOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { FormInstance, TreeSelectProps } from 'antd';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tooltip,
  Tree,
  TreeSelect,
  Typography,
} from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { TrueAdminModal } from '@/core/modal';
import type { AdminMenu } from '../../types/menu';
import type { AdminRole, DataPolicyMetadata } from '../../types/role';
import {
  type DataPolicyFormValues,
  dataPolicyItemKey,
  getMenuChildTreeKeys,
  getMenuTreeKeys,
  mergeMenuGroupCheckedKeys,
  textOf,
  toDataPolicyFormValues,
  toMenuTreeData,
  uniqueKeys,
} from './roleAuthorization';

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
                  <MenuAuthorizationPane
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
                  <DataPolicyAuthorizationPane
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

function MenuAuthorizationPane({
  authorizeLoading,
  checkedMenuIds,
  expandedMenuIds,
  menuGroupKeysMap,
  menuTree,
  setCheckedMenuIds,
  setExpandedMenuIds,
  setStrictMenuCheck,
  strictMenuCheck,
  t,
  onToggleMenuGroupRoot,
}: {
  authorizeLoading: boolean;
  checkedMenuIds: React.Key[];
  expandedMenuIds: React.Key[];
  menuGroupKeysMap: Map<number, React.Key[]>;
  menuTree: AdminMenu[];
  setCheckedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setExpandedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setStrictMenuCheck: (checked: boolean) => void;
  strictMenuCheck: boolean;
  t: (key: string, fallback?: string) => string;
  onToggleMenuGroupRoot: (menu: AdminMenu, checked: boolean) => void;
}) {
  return (
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
            <Tooltip title={t('system.roles.authorize.collapseAll', '收起全部')}>
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
            const groupKeys = menuGroupKeysMap.get(menu.id) ?? getMenuTreeKeys([menu]);
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
                    indeterminate={!checkedMenuIds.includes(menu.id) && childCheckedCount > 0}
                    onChange={(event) => onToggleMenuGroupRoot(menu, event.target.checked)}
                  >
                    {menu.name}
                  </Checkbox>
                }
              >
                {childTreeData && childTreeData.length > 0 ? (
                  <Tree
                    checkable
                    checkStrictly={strictMenuCheck}
                    expandedKeys={expandedMenuIds.filter((key) => childKeys.includes(key))}
                    treeData={childTreeData}
                    checkedKeys={checkedMenuIds.filter((key) => childKeys.includes(key))}
                    onCheck={(keys) => {
                      const nextChildKeys = Array.isArray(keys) ? keys : keys.checked;
                      setCheckedMenuIds((current) =>
                        mergeMenuGroupCheckedKeys(current, groupKeys, menu.id, nextChildKeys),
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
  );
}

function DataPolicyAuthorizationPane({
  authorizeRole,
  dataPolicyForm,
  dataPolicyMetadata,
  dataPolicyScopes,
  dataPolicyStrategyMap,
  departmentTreeData,
  t,
}: {
  authorizeRole?: AdminRole;
  dataPolicyForm: FormInstance<DataPolicyFormValues>;
  dataPolicyMetadata?: DataPolicyMetadata;
  dataPolicyScopes?: DataPolicyFormValues['policies'];
  dataPolicyStrategyMap: Map<string, DataPolicyStrategy>;
  departmentTreeData: TreeSelectProps['treeData'];
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="trueadmin-role-authorize-pane">
      <Form<DataPolicyFormValues>
        form={dataPolicyForm}
        layout="vertical"
        initialValues={toDataPolicyFormValues(dataPolicyMetadata, authorizeRole)}
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
                    const fieldKey = dataPolicyItemKey(resource.key, strategyKey);
                    const scope = dataPolicyScopes?.[fieldKey];
                    const scopeOptions = [
                      {
                        label: t('system.roles.dataPolicy.scope.none', '不授权'),
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
                          <Typography.Text>{textOf(strategy, t)}</Typography.Text>
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
                              {t('system.roles.dataPolicy.departments', '可见部门')}
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
  );
}
