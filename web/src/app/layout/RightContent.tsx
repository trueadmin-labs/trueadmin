import {
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Space } from 'antd';
import { useNavigate } from 'react-router';
import { useCurrentUserQuery, useLogoutMutation } from '@/core/auth/hooks';
import { queryClient } from '@/core/query/client';
import { useLayoutStore } from '@/core/store/layoutStore';
import { type Locale, useLocaleStore } from '@/core/store/localeStore';
import { tokenStorage } from '@/shared/utils/storage';

export function RightContent() {
  const navigate = useNavigate();
  const { data } = useCurrentUserQuery();
  const logout = useLogoutMutation();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const toggleDarkMode = useLayoutStore((state) => state.toggleDarkMode);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  const userItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: data?.nickname || data?.username || '管理员' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Space size={8}>
      <Button
        type="text"
        icon={<TranslationOutlined />}
        onClick={() => setLocale(locale === 'zh-CN' ? 'en-US' : ('zh-CN' as Locale))}
      >
        {locale === 'zh-CN' ? '中' : 'EN'}
      </Button>
      <Button
        type="text"
        icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleDarkMode}
      />
      <Dropdown
        menu={{
          items: userItems,
          onClick: async ({ key }) => {
            if (key !== 'logout') {
              return;
            }
            await logout.mutateAsync();
            tokenStorage.clear();
            queryClient.clear();
            navigate('/login', { replace: true });
          },
        }}
      >
        <Space className="trueadmin-avatar-dropdown">
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{data?.nickname || data?.username || '管理员'}</span>
        </Space>
      </Dropdown>
    </Space>
  );
}
