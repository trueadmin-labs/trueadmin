import { UserOutlined } from '@ant-design/icons';
import { Avatar, Card, Tag, Typography } from 'antd';
import type { CurrentAdminUser } from '@/core/auth/types';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { AdminProfile } from '../../types/profile';

type ProfileIdentityCardProps = {
  currentUser?: CurrentAdminUser;
  loading: boolean;
  profile?: AdminProfile;
  t: TranslateFunction;
};

export function ProfileIdentityCard({
  currentUser,
  loading,
  profile,
  t,
}: ProfileIdentityCardProps) {
  const roleNames = profile?.roleNames?.length ? profile.roleNames : (profile?.roles ?? []);

  return (
    <Card className="trueadmin-profile-card" loading={loading}>
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
        <div className="trueadmin-profile-role-list">
          {roleNames.map((role) => (
            <Tag key={role}>{role}</Tag>
          ))}
        </div>
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
  );
}
