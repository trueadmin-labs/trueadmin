import { SafetyCertificateOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { App, Form, Space, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { authKeys, useCurrentUserQuery } from '@/core/auth';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { profilePreferenceManifests } from '@/core/profile';
import { queryClient } from '@/core/query/client';
import { profileApi } from '../../services/profile.api';
import type { AdminProfile } from '../../types/profile';
import { ProfileBasicForm } from './ProfileBasicForm';
import { ProfileIdentityCard } from './ProfileIdentityCard';
import { ProfilePasswordForm } from './ProfilePasswordForm';
import { ProfilePreferenceSettings } from './ProfilePreferenceSettings';
import type { PasswordFormValues, ProfileFormValues } from './profilePageTypes';

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

  return (
    <TrueAdminPage
      showHeader
      title={t('system.profile.title', '个人中心')}
      description={t('system.profile.description', '维护当前登录账号的基础资料和安全设置。')}
    >
      <Space orientation="vertical" size={16} className="trueadmin-profile-layout">
        <ProfileIdentityCard
          currentUser={currentUser}
          loading={profileLoading}
          profile={profile}
          t={t}
        />

        <Tabs
          className="trueadmin-profile-tabs"
          items={[
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: t('system.profile.card.profile', '基础资料'),
              children: (
                <ProfileBasicForm
                  form={profileForm}
                  loading={profileLoading}
                  t={t}
                  onSubmit={() => void submitProfile()}
                />
              ),
            },
            {
              key: 'password',
              icon: <SafetyCertificateOutlined />,
              label: t('system.profile.card.password', '安全设置'),
              children: (
                <ProfilePasswordForm
                  form={passwordForm}
                  loading={passwordLoading}
                  t={t}
                  onSubmit={() => void submitPassword()}
                />
              ),
            },
            {
              key: 'preferences',
              icon: <SettingOutlined />,
              label: t('system.profile.section.preferences', '偏好设置'),
              children: (
                <ProfilePreferenceSettings
                  activePreferenceKey={activePreferenceKey}
                  preferenceSavingKey={preferenceSavingKey}
                  profile={profile}
                  t={t}
                  onChangeActivePreference={setActivePreferenceKey}
                  onSavePreference={savePreference}
                />
              ),
            },
          ]}
        />
      </Space>
    </TrueAdminPage>
  );
}
