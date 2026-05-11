import {
  LockOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Menu,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { authKeys, useCurrentUserQuery } from '@/core/auth';
import { useI18n } from '@/core/i18n/I18nProvider';
import { resolveTrans } from '@/core/i18n/trans';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { profilePreferenceManifests } from '@/core/profile';
import { queryClient } from '@/core/query/client';
import { profileApi } from '../../services/profile.api';
import type {
  AdminPasswordUpdatePayload,
  AdminProfile,
  AdminProfileUpdatePayload,
} from '../../types/profile';

type ProfileFormValues = AdminProfileUpdatePayload;

type PasswordFormValues = AdminPasswordUpdatePayload & {
  confirmPassword: string;
};

export default function AdminProfilePage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const { data: currentUser, refetch } = useCurrentUserQuery();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferenceSavingKey, setPreferenceSavingKey] = useState<string>();
  const [profile, setProfile] = useState<AdminProfile>();
  const [activePreferenceKey, setActivePreferenceKey] = useState<string | undefined>(
    profilePreferenceManifests[0]?.key,
  );

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    profileApi
      .detail()
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setProfile(detail);
        profileForm.setFieldsValue({ nickname: detail.nickname, avatar: detail.avatar ?? '' });
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profileForm]);

  const roleTags = useMemo(
    () =>
      (profile?.roleNames?.length ? profile.roleNames : (profile?.roles ?? [])).map((role) => (
        <Tag key={role}>{role}</Tag>
      )),
    [profile?.roleNames, profile?.roles],
  );

  useEffect(() => {
    if (profilePreferenceManifests.length === 0) {
      setActivePreferenceKey(undefined);
      return;
    }

    if (
      !activePreferenceKey ||
      !profilePreferenceManifests.some((preference) => preference.key === activePreferenceKey)
    ) {
      setActivePreferenceKey(profilePreferenceManifests[0].key);
    }
  }, [activePreferenceKey]);

  const activePreference = useMemo(
    () => profilePreferenceManifests.find((preference) => preference.key === activePreferenceKey),
    [activePreferenceKey],
  );

  const submitProfile = async () => {
    const values = await profileForm.validateFields();
    setProfileLoading(true);
    try {
      const nextProfile = await profileApi.update(values);
      setProfile(nextProfile);
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      await refetch();
      message.success(t('system.profile.success.update', '个人资料已保存'));
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async () => {
    const values = await passwordForm.validateFields();
    setPasswordLoading(true);
    try {
      await profileApi.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success(t('system.profile.success.password', '密码已修改'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const savePreference = async (namespace: string, values: Record<string, unknown>) => {
    setPreferenceSavingKey(namespace);
    try {
      const nextProfile = await profileApi.updatePreferences({ namespace, values });
      setProfile(nextProfile);
      queryClient.setQueryData(authKeys.me, (current: unknown) =>
        current && typeof current === 'object'
          ? { ...current, preferences: nextProfile.preferences }
          : current,
      );
      message.success(t('system.profile.success.preferences', '偏好设置已保存'));
    } finally {
      setPreferenceSavingKey(undefined);
    }
  };

  const renderBasicProfile = () => (
    <Card>
      <Form form={profileForm} layout="vertical" disabled={profileLoading}>
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
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={profileLoading}
          onClick={submitProfile}
        >
          {t('system.profile.action.saveProfile', '保存资料')}
        </Button>
      </Form>
    </Card>
  );

  const renderPasswordSettings = () => (
    <Card>
      <Form form={passwordForm} layout="vertical" disabled={passwordLoading}>
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
        <Button
          type="primary"
          icon={<LockOutlined />}
          loading={passwordLoading}
          onClick={submitPassword}
        >
          {t('system.profile.action.updatePassword', '修改密码')}
        </Button>
      </Form>
    </Card>
  );

  const renderPreferencePanel = () => {
    if (!activePreference) {
      return (
        <Card className="trueadmin-profile-preference-empty-card">
          <Empty description={t('system.profile.preferences.empty', '暂无可配置的偏好设置')} />
        </Card>
      );
    }

    const value = profile?.preferences?.[activePreference.key];
    const preferenceValue =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    return (
      <Card
        title={
          <Space size={8}>
            <SettingOutlined />
            <span>{resolveTrans(activePreference.title, t)}</span>
          </Space>
        }
        className="trueadmin-profile-preference-card"
      >
        {activePreference.description ? (
          <Typography.Paragraph
            type="secondary"
            className="trueadmin-profile-preference-description"
          >
            {resolveTrans(activePreference.description, t)}
          </Typography.Paragraph>
        ) : null}
        {activePreference.render({
          namespace: activePreference.key,
          value: preferenceValue,
          preferences: profile?.preferences ?? {},
          saving: preferenceSavingKey === activePreference.key,
          save: (values) => savePreference(activePreference.key, values),
          t,
        })}
      </Card>
    );
  };

  const renderPreferenceSettings = () => (
    <div className="trueadmin-profile-preference-workspace">
      <aside className="trueadmin-profile-preference-nav">
        {profilePreferenceManifests.length === 0 ? (
          <Empty description={t('system.profile.preferences.empty', '暂无可配置的偏好设置')} />
        ) : (
          <Menu
            mode="inline"
            selectedKeys={activePreferenceKey ? [activePreferenceKey] : []}
            onClick={({ key }) => setActivePreferenceKey(key)}
            items={profilePreferenceManifests.map((preference) => ({
              key: preference.key,
              icon: <SettingOutlined />,
              label: resolveTrans(preference.title, t),
            }))}
          />
        )}
      </aside>
      <div className="trueadmin-profile-preference-detail">{renderPreferencePanel()}</div>
    </div>
  );

  return (
    <TrueAdminPage
      showHeader
      title={t('system.profile.title', '个人中心')}
      description={t('system.profile.description', '维护当前登录账号的基础资料和安全设置。')}
    >
      <Space orientation="vertical" size={16} className="trueadmin-profile-layout">
        <Card className="trueadmin-profile-card" loading={profileLoading}>
          <div className="trueadmin-profile-identity-card">
            <Avatar
              size={88}
              src={profile?.avatar || currentUser?.avatar || undefined}
              icon={<UserOutlined />}
            />
            <div className="trueadmin-profile-summary-text">
              <Typography.Title level={4}>
                {profile?.nickname || currentUser?.nickname || profile?.username}
              </Typography.Title>
              <Typography.Text type="secondary">
                @{profile?.username || currentUser?.username}
              </Typography.Text>
            </div>
            <div className="trueadmin-profile-role-list">{roleTags}</div>
            <div className="trueadmin-profile-meta-grid">
              <div className="trueadmin-profile-meta-item">
                <Typography.Text type="secondary">
                  {t('system.profile.field.id', '账号 ID')}
                </Typography.Text>
                <Typography.Text strong>{profile?.id ?? '-'}</Typography.Text>
              </div>
              <div className="trueadmin-profile-meta-item">
                <Typography.Text type="secondary">
                  {t('system.profile.field.primaryDeptId', '主部门')}
                </Typography.Text>
                <Typography.Text strong>
                  {profile?.primaryDeptPath || profile?.primaryDeptName || '-'}
                </Typography.Text>
              </div>
              <div className="trueadmin-profile-meta-item">
                <Typography.Text type="secondary">
                  {t('system.profile.field.createdAt', '创建时间')}
                </Typography.Text>
                <Typography.Text strong>{profile?.createdAt ?? '-'}</Typography.Text>
              </div>
            </div>
          </div>
        </Card>

        <Tabs
          className="trueadmin-profile-tabs"
          items={[
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: t('system.profile.card.profile', '基础资料'),
              children: renderBasicProfile(),
            },
            {
              key: 'password',
              icon: <SafetyCertificateOutlined />,
              label: t('system.profile.card.password', '安全设置'),
              children: renderPasswordSettings(),
            },
            {
              key: 'preferences',
              icon: <SettingOutlined />,
              label: t('system.profile.section.preferences', '偏好设置'),
              children: renderPreferenceSettings(),
            },
          ]}
        />
      </Space>
    </TrueAdminPage>
  );
}
