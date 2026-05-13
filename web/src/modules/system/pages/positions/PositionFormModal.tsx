import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { FormInstance, SelectProps, TreeSelectProps } from 'antd';
import {
  Alert,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';
import { useMemo } from 'react';
import { TrueAdminLoadingContainer } from '@/core/loading';
import { TrueAdminModal } from '@/core/modal';
import type { AdminRoleOption } from '../../services/role.api';
import type { AdminPosition } from '../../types/position';
import type { PositionFormValues } from './positionPageModel';

type PositionFormModalProps = {
  departmentSelectDisabled?: boolean;
  editing?: AdminPosition;
  form: FormInstance<PositionFormValues>;
  loading?: boolean;
  open: boolean;
  roleOptions: SelectProps['options'];
  roles: AdminRoleOption[];
  statusText: Record<AdminPosition['status'], string>;
  submitting: boolean;
  t: TranslateFunction;
  treeData: TreeSelectProps['treeData'];
  onCancel: () => void;
  onSubmit: () => void;
};

export function PositionFormModal({
  departmentSelectDisabled = false,
  editing,
  form,
  loading = false,
  open,
  roleOptions,
  roles,
  statusText,
  submitting,
  t,
  treeData,
  onCancel,
  onSubmit,
}: PositionFormModalProps) {
  const selectedRoleIds = Form.useWatch('roleIds', form) ?? [];
  const selectedRoleIdSet = useMemo(
    () => new Set(Array.isArray(selectedRoleIds) ? selectedRoleIds.map(Number) : []),
    [selectedRoleIds],
  );
  const selectedRoles = useMemo(
    () => roles.filter((role) => selectedRoleIdSet.has(role.id)),
    [roles, selectedRoleIdSet],
  );
  const selectedDataPolicies = selectedRoles.flatMap((role) =>
    (role.dataPolicies ?? []).map((policy) => ({
      ...policy,
      roleName: role.name,
    })),
  );
  const hasAllDataScope = selectedDataPolicies.some((policy) => policy.scope === 'all');

  return (
    <TrueAdminModal
      destroyOnHidden
      confirmLoading={submitting}
      okButtonProps={{ disabled: loading }}
      open={open}
      title={
        editing
          ? t('system.positions.modal.edit', '编辑岗位')
          : t('system.positions.modal.create', '新增岗位')
      }
      width={640}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <TrueAdminLoadingContainer loading={loading} initialLoadingHeight={360}>
        <Form<PositionFormValues>
          form={form}
          layout="vertical"
          initialValues={{ type: 'normal', sort: 0, status: 'enabled', isLeadership: false }}
        >
          <Form.Item
            label={t('system.positions.form.deptId', '所属部门')}
            name="deptId"
            rules={[
              {
                required: true,
                message: t('system.positions.form.deptRequired', '请选择所属部门'),
              },
            ]}
          >
            <TreeSelect
              showSearch
              disabled={departmentSelectDisabled}
              treeData={treeData}
              treeDefaultExpandAll
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item
            label={t('system.positions.form.name', '岗位名称')}
            name="name"
            rules={[
              {
                required: true,
                message: t('system.positions.form.nameRequired', '请输入岗位名称'),
              },
            ]}
          >
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item
            label={t('system.positions.form.code', '岗位编码')}
            name="code"
            rules={[
              {
                required: true,
                message: t('system.positions.form.codeRequired', '请输入岗位编码'),
              },
            ]}
          >
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item label={t('system.positions.form.roleIds', '绑定角色')} name="roleIds">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={roleOptions}
            />
          </Form.Item>
          {selectedRoles.length > 0 ? (
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Alert
                showIcon
                type={hasAllDataScope ? 'warning' : 'info'}
                title={
                  hasAllDataScope
                    ? t('system.positions.form.roleAllScopeWarning', '已选择包含全部数据范围的角色')
                    : t('system.positions.form.rolePolicyPreview', '角色数据权限预览')
                }
                description={
                  hasAllDataScope
                    ? t(
                        'system.positions.form.roleAllScopeDescription',
                        '岗位绑定该角色后会获得全部数据范围。请确认这是特权岗位。',
                      )
                    : t(
                        'system.positions.form.rolePolicyDescription',
                        '数据范围配置在角色权限包上，最终会通过岗位所属部门上下文生效。',
                      )
                }
              />
              {selectedDataPolicies.length > 0 ? (
                <Space wrap size={[6, 6]}>
                  {selectedDataPolicies.map((policy) => (
                    <Tag
                      color={policy.scope === 'all' ? 'red' : 'blue'}
                      key={`${policy.roleId}-${policy.resource}-${policy.strategy}-${policy.scope}`}
                    >
                      {policy.roleName} / {dataPolicyResourceLabel(policy.resource, t)} /{' '}
                      {dataPolicyScopeLabel(policy.scope, t)}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  {t('system.positions.form.rolePolicyEmpty', '所选角色尚未配置数据权限。')}
                </Typography.Text>
              )}
            </Space>
          ) : null}
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item label={t('system.positions.form.type', '岗位类型')} name="type">
              <Select
                style={{ width: 180 }}
                options={[
                  { label: t('system.positions.type.normal', '普通岗位'), value: 'normal' },
                  { label: t('system.positions.type.system', '系统岗位'), value: 'system' },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('system.positions.form.sort', '排序')} name="sort">
              <InputNumber style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label={t('system.positions.form.status', '状态')} name="status">
              <Select
                style={{ width: 160 }}
                options={[
                  { label: statusText.enabled, value: 'enabled' },
                  { label: statusText.disabled, value: 'disabled' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item
            label={t('system.positions.form.isLeadership', '负责人岗位')}
            name="isLeadership"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t('system.positions.form.description', '说明')} name="description">
            <Input.TextArea maxLength={512} rows={3} />
          </Form.Item>
        </Form>
      </TrueAdminLoadingContainer>
    </TrueAdminModal>
  );
}

const dataPolicyScopeLabel = (scope: string, t: TranslateFunction): string => {
  const i18nKey = `dataPolicy.scope.${scope.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  const fallback: Record<string, string> = {
    all: '全部数据',
    custom_departments: '自定义部门',
    custom_departments_and_children: '自定义部门及子部门',
    department: '本部门',
    department_and_children: '本部门及子部门',
    self: '仅本人',
  };

  return t(i18nKey, fallback[scope] ?? scope);
};

const dataPolicyResourceLabel = (resource: string, t: TranslateFunction): string => {
  const i18nKey = `dataPolicy.resource.${resource.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;

  return t(i18nKey, resource);
};
