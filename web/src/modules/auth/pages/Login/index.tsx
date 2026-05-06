import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Helmet, SelectLang, useIntl, useModel } from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import { useModuleLocale } from '@/locales/useModuleLocale';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/foundation/layout/components';
import { login } from '@/modules/auth/services';
import { setAccessToken } from '@/foundation/auth/token';
import Settings from '@root/config/defaultSettings';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    min-height: 100vh;
    overflow: auto;
    background:
      radial-gradient(circle at 12% 18%, rgba(20, 184, 166, 0.2), transparent 28%),
      radial-gradient(circle at 82% 12%, rgba(15, 118, 110, 0.18), transparent 32%),
      linear-gradient(135deg, #f7fbf9 0%, #ecf7f3 46%, #f9faf5 100%);
  `,
  lang: css`
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 10;
    width: 42px;
    height: 42px;
    line-height: 42px;
    border-radius: ${token.borderRadiusLG}px;
    text-align: center;
    transition: background ${token.motionDurationMid};

    &:hover {
      background: ${token.colorBgTextHover};
    }
  `,
  content: css`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 96px);
    padding: 48px 24px 24px;
  `,
  panel: css`
    width: min(960px, 100%);
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 32px;
    align-items: center;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  hero: css`
    padding: 24px;

    @media (max-width: 900px) {
      display: none;
    }
  `,
  eyebrow: css`
    margin-bottom: 18px;
    color: ${token.colorPrimary};
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  `,
  title: css`
    margin: 0;
    color: #102421;
    font-size: 52px;
    line-height: 1.04;
    letter-spacing: -0.05em;
  `,
  desc: css`
    max-width: 520px;
    margin-top: 20px;
    color: ${token.colorTextSecondary};
    font-size: 16px;
    line-height: 1.8;
  `,
  card: css`
    padding: 10px 0 0;
    border: 1px solid rgba(15, 118, 110, 0.12);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 24px 80px rgba(15, 118, 110, 0.14);
    backdrop-filter: blur(18px);
  `,
  error: css`
    margin-bottom: 24px;
  `,
}));

const getErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    const requestError = error as Error & { info?: { message?: string } };
    return requestError.info?.message || requestError.message;
  }

  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

const Login: React.FC = () => {
  useModuleLocale('auth');
  const [errorMessage, setErrorMessage] = useState<string>();
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const getSafeRedirectUrl = (redirect: string | null): string => {
    if (!redirect?.startsWith('/') || redirect.startsWith('//')) return '/';

    try {
      const parsed = new URL(redirect, window.location.origin);
      if (parsed.origin !== window.location.origin) return '/';
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return '/';
    }
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    setErrorMessage(undefined);

    try {
      const result = await login({
        username: values.username || '',
        password: values.password || '',
        autoLogin: values.autoLogin,
      });
      setAccessToken(result.accessToken);
      message.success(
        intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功',
        }),
      );
      await fetchUserInfo();
      const urlParams = new URL(window.location.href).searchParams;
      window.location.href = getSafeRedirectUrl(urlParams.get('redirect'));
    } catch (error: unknown) {
      const backendMessage = getErrorMessage(error);
      const fallback = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请检查账号或密码',
      });
      setErrorMessage(backendMessage || fallback);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({ id: 'menu.login', defaultMessage: '登录' })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <div className={styles.lang} data-lang>
        {SelectLang && <SelectLang />}
      </div>
      <div className={styles.content}>
        <div className={styles.panel}>
          <section className={styles.hero}>
            <div className={styles.eyebrow}>TrueAdmin Framework</div>
            <h1 className={styles.title}>为 AI 时代准备的后台脚手架。</h1>
            <p className={styles.desc}>
              基于 Hyperf 模块化后端与 Ant Design Pro 管理端，预留插件、权限、元数据与 OpenAPI 的长期演进空间。
            </p>
          </section>
          <section className={styles.card}>
            <LoginForm
              contentStyle={{ minWidth: 280, maxWidth: 360 }}
              logo={<img alt="TrueAdmin" src="/logo.svg" />}
              title="TrueAdmin"
              subTitle={intl.formatMessage({ id: 'pages.layouts.userLayout.title' })}
              initialValues={{ autoLogin: true, username: 'admin' }}
              onFinish={async (values) => handleSubmit(values as API.LoginParams)}
            >
              {errorMessage && (
                <Alert className={styles.error} message={errorMessage} type="error" showIcon />
              )}
              <ProFormText
                name="username"
                fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: '请输入用户名',
                })}
                rules={[{ required: true, message: intl.formatMessage({ id: 'pages.login.username.required' }) }]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: '请输入密码',
                })}
                rules={[{ required: true, message: intl.formatMessage({ id: 'pages.login.password.required' }) }]}
              />
              <ProFormCheckbox noStyle name="autoLogin">
                {intl.formatMessage({ id: 'pages.login.rememberMe' })}
              </ProFormCheckbox>
            </LoginForm>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
