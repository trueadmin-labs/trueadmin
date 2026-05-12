import { LockOutlined } from '@ant-design/icons';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Button, Card, Form, type FormInstance, Input } from 'antd';
import type { PasswordFormValues } from './profilePageTypes';

type ProfilePasswordFormProps = {
  form: FormInstance<PasswordFormValues>;
  loading: boolean;
  t: TranslateFunction;
  onSubmit: () => void;
};

export function ProfilePasswordForm({ form, loading, t, onSubmit }: ProfilePasswordFormProps) {
  return (
    <Card>
      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          label={t('system.profile.field.oldPassword', '当前密码')}
          name="oldPassword"
          rules={[
            {
              required: true,
              message: t('system.profile.validate.oldPassword', '请输入当前密码'),
            },
          ]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          label={t('system.profile.field.newPassword', '新密码')}
          name="newPassword"
          rules={[
            {
              required: true,
              min: 6,
              message: t('system.profile.validate.newPassword', '请输入至少 6 位新密码'),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label={t('system.profile.field.confirmPassword', '确认新密码')}
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: t('system.profile.validate.confirmPassword', '请再次输入新密码'),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    t('system.profile.validate.passwordMismatch', '两次输入的新密码不一致'),
                  ),
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" icon={<LockOutlined />} loading={loading} onClick={onSubmit}>
          {t('system.profile.action.updatePassword', '修改密码')}
        </Button>
      </Form>
    </Card>
  );
}
