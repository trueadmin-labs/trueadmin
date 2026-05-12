import { SettingOutlined } from '@ant-design/icons';
import { resolveTrans, type TranslateFunction } from '@trueadmin/web-core/i18n';
import { Card, Empty, Menu, Space, Typography } from 'antd';
import { profilePreferenceManifests } from '@/core/profile';
import type { AdminProfile } from '../../types/profile';

type ProfilePreferenceSettingsProps = {
  activePreferenceKey?: string;
  preferenceSavingKey?: string;
  profile?: AdminProfile;
  t: TranslateFunction;
  onChangeActivePreference: (key: string) => void;
  onSavePreference: (namespace: string, values: Record<string, unknown>) => Promise<void>;
};

export function ProfilePreferenceSettings({
  activePreferenceKey,
  preferenceSavingKey,
  profile,
  t,
  onChangeActivePreference,
  onSavePreference,
}: ProfilePreferenceSettingsProps) {
  const activePreference = profilePreferenceManifests.find(
    (preference) => preference.key === activePreferenceKey,
  );

  return (
    <div className="trueadmin-profile-preference-workspace">
      <aside className="trueadmin-profile-preference-nav">
        {profilePreferenceManifests.length === 0 ? (
          <Empty description={t('system.profile.preferences.empty', '暂无可配置的偏好设置')} />
        ) : (
          <Menu
            mode="inline"
            selectedKeys={activePreferenceKey ? [activePreferenceKey] : []}
            onClick={({ key }) => onChangeActivePreference(String(key))}
            items={profilePreferenceManifests.map((preference) => ({
              key: preference.key,
              icon: <SettingOutlined />,
              label: resolveTrans(preference.title, t),
            }))}
          />
        )}
      </aside>
      <div className="trueadmin-profile-preference-detail">
        <ProfilePreferencePanel
          activePreferenceKey={activePreferenceKey}
          activePreference={activePreference}
          preferenceSavingKey={preferenceSavingKey}
          profile={profile}
          t={t}
          onSavePreference={onSavePreference}
        />
      </div>
    </div>
  );
}

type ProfilePreferencePanelProps = Pick<
  ProfilePreferenceSettingsProps,
  'activePreferenceKey' | 'preferenceSavingKey' | 'profile' | 't' | 'onSavePreference'
> & {
  activePreference: (typeof profilePreferenceManifests)[number] | undefined;
};

function ProfilePreferencePanel({
  activePreference,
  preferenceSavingKey,
  profile,
  t,
  onSavePreference,
}: ProfilePreferencePanelProps) {
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
        <Typography.Paragraph type="secondary" className="trueadmin-profile-preference-description">
          {resolveTrans(activePreference.description, t)}
        </Typography.Paragraph>
      ) : null}
      {activePreference.render({
        namespace: activePreference.key,
        value: preferenceValue,
        preferences: profile?.preferences ?? {},
        saving: preferenceSavingKey === activePreference.key,
        save: (values) => onSavePreference(activePreference.key, values),
        t,
      })}
    </Card>
  );
}
