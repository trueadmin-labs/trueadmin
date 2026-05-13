import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { FormInstance, SelectProps, TreeSelectProps } from 'antd';
import { Form, Input, Select, Space, Tag, TreeSelect, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { TrueAdminLoadingContainer } from '@/core/loading';
import { TrueAdminModal } from '@/core/modal';
import type { AdminUser, AdminUserCreatePayload } from '../../types/admin-user';
import type { AdminPositionOption } from '../../types/position';

type UserFormModalProps = {
  editing?: AdminUser;
  form: FormInstance<AdminUserCreatePayload>;
  loading?: boolean;
  open: boolean;
  positionOptions: AdminPositionOption[];
  statusText: Record<AdminUser['status'], string>;
  submitting: boolean;
  t: TranslateFunction;
  treeData: TreeSelectProps['treeData'];
  onCancel: () => void;
  onSubmit: () => void;
};

const toNumberList = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
    : [];

export function UserFormModal({
  editing,
  form,
  loading = false,
  open,
  positionOptions,
  statusText,
  submitting,
  t,
  treeData,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  const selectedDeptIds = toNumberList(Form.useWatch('deptIds', form));
  const selectedPositionIds = toNumberList(Form.useWatch('positionIds', form));
  const primaryDeptId = Number(Form.useWatch('primaryDeptId', form) ?? 0);
  const selectedDeptSet = useMemo(() => new Set(selectedDeptIds), [selectedDeptIds]);
  const positionDeptIdMap = useMemo(
    () => new Map(positionOptions.map((position) => [position.id, position.deptId])),
    [positionOptions],
  );
  const selectedPositionDeptSet = useMemo(
    () =>
      new Set(
        selectedPositionIds
          .map((positionId) => positionDeptIdMap.get(positionId))
          .filter((deptId): deptId is number => typeof deptId === 'number' && deptId > 0),
      ),
    [positionDeptIdMap, selectedPositionIds],
  );
  const filteredPositionOptions = useMemo<SelectProps['options']>(
    () =>
      positionOptions.map((position) => ({
        disabled: selectedDeptSet.size > 0 && !selectedDeptSet.has(position.deptId),
        label: `${position.deptPath || position.deptName} / ${position.name}`,
        value: position.id,
      })),
    [positionOptions, selectedDeptSet],
  );
  const effectiveRoleNames = editing?.roleNames ?? [];
  const directRoleNames = editing?.directRoleNames ?? [];

  useEffect(() => {
    if (selectedDeptIds.length === 0) {
      return;
    }
    if (primaryDeptId > 0 && selectedDeptSet.has(primaryDeptId)) {
      return;
    }

    form.setFieldValue('primaryDeptId', selectedDeptIds[0]);
  }, [form, primaryDeptId, selectedDeptIds, selectedDeptSet]);

  useEffect(() => {
    if (selectedDeptSet.size === 0 || selectedPositionIds.length === 0) {
      return;
    }

    const nextPositionIds = selectedPositionIds.filter((positionId) => {
      const deptId = positionDeptIdMap.get(positionId);

      return deptId !== undefined && selectedDeptSet.has(deptId);
    });

    if (nextPositionIds.length !== selectedPositionIds.length) {
      form.setFieldValue('positionIds', nextPositionIds);
    }
  }, [form, positionDeptIdMap, selectedDeptSet, selectedPositionIds]);

  return (
    <TrueAdminModal
      destroyOnHidden
      confirmLoading={submitting}
      okButtonProps={{ disabled: loading }}
      open={open}
      title={
        editing
          ? t('system.users.modal.edit', '编辑成员')
          : t('system.users.modal.create', '新增成员')
      }
      width={680}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <TrueAdminLoadingContainer loading={loading} initialLoadingHeight={420}>
        <Form<AdminUserCreatePayload>
          form={form}
          layout="vertical"
          initialValues={{ status: 'enabled', deptIds: [], positionIds: [] }}
        >
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              label={t('system.users.form.username', '用户名')}
              name="username"
              rules={[
                {
                  required: true,
                  message: t('system.users.form.usernameRequired', '请输入用户名'),
                },
              ]}
              style={{ flex: 1 }}
            >
              <Input maxLength={64} />
            </Form.Item>
            <Form.Item
              label={t('system.users.form.nickname', '昵称')}
              name="nickname"
              style={{ flex: 1 }}
            >
              <Input maxLength={64} />
            </Form.Item>
          </Space>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item
              label={t('system.users.form.password', '密码')}
              name="password"
              rules={
                editing
                  ? [{ min: 6, message: t('system.users.form.passwordMin', '密码至少 6 位') }]
                  : [
                      {
                        required: true,
                        message: t('system.users.form.passwordRequired', '请输入密码'),
                      },
                      { min: 6, message: t('system.users.form.passwordMin', '密码至少 6 位') },
                    ]
              }
              style={{ flex: 1 }}
            >
              <Input.Password maxLength={128} placeholder={editing ? '******' : undefined} />
            </Form.Item>
            <Form.Item label={t('system.users.form.status', '状态')} name="status">
              <Select
                style={{ width: 180 }}
                options={[
                  { label: statusText.enabled, value: 'enabled' },
                  { label: statusText.disabled, value: 'disabled' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item
            label={t('system.users.form.deptIds', '所属部门')}
            name="deptIds"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: t('system.users.form.deptIdsRequired', '请选择所属部门'),
              },
            ]}
          >
            <TreeSelect
              multiple
              showSearch
              treeData={treeData}
              treeDefaultExpandAll
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item
            label={t('system.users.form.primaryDeptId', '主部门')}
            name="primaryDeptId"
            rules={[
              {
                required: true,
                message: t('system.users.form.primaryDeptRequired', '请选择主部门'),
              },
              {
                validator: (_, value) => {
                  if (!value || selectedDeptSet.has(Number(value))) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      t('system.users.form.primaryDeptMustInDepartments', '主部门必须属于已选部门'),
                    ),
                  );
                },
              },
            ]}
          >
            <TreeSelect
              showSearch
              treeData={treeData}
              treeDefaultExpandAll
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item
            label={t('system.users.form.positionIds', '岗位')}
            name="positionIds"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: t('system.users.form.positionIdsRequired', '请选择岗位'),
              },
              {
                validator: (_, value) => {
                  const positionIds = toNumberList(value);
                  if (selectedDeptIds.length === 0 || positionIds.length === 0) {
                    return Promise.resolve();
                  }

                  const outsideDepartment = positionIds.some((positionId) => {
                    const deptId = positionDeptIdMap.get(positionId);

                    return deptId === undefined || !selectedDeptSet.has(deptId);
                  });
                  if (outsideDepartment) {
                    return Promise.reject(
                      new Error(
                        t(
                          'system.users.form.positionMustInDepartments',
                          '岗位必须属于成员已选部门',
                        ),
                      ),
                    );
                  }

                  const uncoveredDeptIds = selectedDeptIds.filter(
                    (deptId) => !selectedPositionDeptSet.has(deptId),
                  );
                  if (uncoveredDeptIds.length > 0) {
                    return Promise.reject(
                      new Error(
                        t(
                          'system.users.form.eachDeptRequiresPosition',
                          '每个所属部门至少需要选择一个岗位',
                        ),
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={filteredPositionOptions}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            {t(
              'system.users.form.positionHint',
              '成员在每个所属部门下至少需要一个岗位，菜单和数据权限通过岗位绑定的角色权限包生效。',
            )}
          </Typography.Text>
          {editing ? (
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item
                label={t('system.users.form.effectiveRoles', '有效角色')}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <RoleTagList
                  emptyText={t('system.users.column.roles.empty', '无')}
                  roleNames={effectiveRoleNames}
                />
              </Form.Item>
              {directRoleNames.length > 0 ? (
                <Form.Item
                  label={t('system.users.form.directRoles', '直接角色')}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <RoleTagList
                    emptyText={t('system.users.column.roles.empty', '无')}
                    roleNames={directRoleNames}
                  />
                </Form.Item>
              ) : null}
            </Space>
          ) : null}
        </Form>
      </TrueAdminLoadingContainer>
    </TrueAdminModal>
  );
}

function RoleTagList({ emptyText, roleNames }: { emptyText: string; roleNames: string[] }) {
  if (roleNames.length === 0) {
    return <Typography.Text type="secondary">{emptyText}</Typography.Text>;
  }

  return (
    <Space wrap size={[4, 4]}>
      {roleNames.map((roleName) => (
        <Tag key={roleName}>{roleName}</Tag>
      ))}
    </Space>
  );
}
