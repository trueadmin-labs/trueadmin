import { SaveOutlined } from '@ant-design/icons';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import { Button, Card, Form, type FormInstance, Input } from 'antd';
import type { ProfileFormValues } from './profilePageTypes';

type ProfileBasicFormProps = {
  form: FormInstance<ProfileFormValues>;
  loading: boolean;
  t: TranslateFunction;
  onSubmit: () => void;
};

export function ProfileBasicForm({ form, loading, t, onSubmit }: ProfileBasicFormProps) {
  return (
    <Card>
      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          label={t('system.profile.field.nickname', '昵称')}
          name="nickname"
          rules={[
            {
              required: true,
              message: t('system.profile.validate.nickname', '请输入昵称'),
            },
          ]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item label={t('system.profile.field.avatar', '头像地址')} name="avatar">
          <Input maxLength={512} placeholder="https://" />
        </Form.Item>
        <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={onSubmit}>
          {t('system.profile.action.saveProfile', '保存资料')}
        </Button>
      </Form>
    </Card>
  );
}
