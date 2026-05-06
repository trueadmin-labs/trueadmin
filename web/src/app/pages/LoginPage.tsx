import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { appConfig } from '@config/index';
import { App, Card, Typography } from 'antd';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useLoginMutation } from '@/core/auth/hooks';
import { queryClient } from '@/core/query/client';
import { tokenStorage } from '@/shared/utils/storage';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const { message } = App.useApp();

  return (
    <main className="trueadmin-login-page">
      <motion.section
        className="trueadmin-login-card"
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Card variant="borderless">
          <LoginForm
            title={appConfig.name}
            subTitle="模块化后台开发框架"
            onFinish={async (values) => {
              const result = await login.mutateAsync({
                username: String(values.username || ''),
                password: String(values.password || ''),
              });
              if (result.accessToken) {
                tokenStorage.set(result.accessToken);
              }
              await queryClient.invalidateQueries();
              message.success('登录成功');
              navigate(appConfig.defaultHome, { replace: true });
              return true;
            }}
          >
            <Typography.Paragraph type="secondary" className="trueadmin-login-hint">
              开发环境默认账号通常为 admin / 123456，请以实际种子数据为准。
            </Typography.Paragraph>
            <ProFormText
              name="username"
              fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
              placeholder="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
              placeholder="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            />
          </LoginForm>
        </Card>
      </motion.section>
    </main>
  );
}
