import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { FormInstance } from 'antd';
import { Form, Input, InputNumber, Select, Space } from 'antd';
import { TrueAdminModal } from '@/core/modal';
import type { AdminRole } from '../../types/role';
import type { RoleFormValues } from './roleAuthorization';

type RoleFormModalProps = {
  editing?: AdminRole;
  form: FormInstance<RoleFormValues>;
  open: boolean;
  statusText: Record<AdminRole['status'], string>;
  submitting: boolean;
  t: TranslateFunction;
  onCancel: () => void;
  onSubmit: () => void;
};

export function RoleFormModal({
  editing,
  form,
  open,
  statusText,
  submitting,
  t,
  onCancel,
  onSubmit,
}: RoleFormModalProps) {
  return (
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
      onCancel={onCancel}
      onOk={onSubmit}
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
  );
}
