import type { FormInstance, TreeSelectProps } from 'antd';
import { Card, Form, Select, Space, TreeSelect, Typography } from 'antd';
import type { AdminRole, DataPolicyMetadata } from '../../types/role';
import {
  type DataPolicyFormValues,
  dataPolicyItemKey,
  textOf,
  toDataPolicyFormValues,
} from './roleAuthorization';

type DataPolicyStrategy = DataPolicyMetadata['strategies'][number];

type RoleDataPolicyAuthorizationPaneProps = {
  authorizeRole?: AdminRole;
  dataPolicyForm: FormInstance<DataPolicyFormValues>;
  dataPolicyMetadata?: DataPolicyMetadata;
  dataPolicyScopes?: DataPolicyFormValues['policies'];
  dataPolicyStrategyMap: Map<string, DataPolicyStrategy>;
  departmentTreeData: TreeSelectProps['treeData'];
  t: (key: string, fallback?: string) => string;
};

export function RoleDataPolicyAuthorizationPane({
  authorizeRole,
  dataPolicyForm,
  dataPolicyMetadata,
  dataPolicyScopes,
  dataPolicyStrategyMap,
  departmentTreeData,
  t,
}: RoleDataPolicyAuthorizationPaneProps) {
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
