import {
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown } from 'antd';
import { useNavigate } from 'react-router';
import { useCurrentUserQuery, useLogoutMutation } from '@/core/auth/hooks';
import { TrueAdminNotificationBell } from '@/core/notification';
import { queryClient } from '@/core/query/client';
import { useLayoutStore } from '@/core/store/layoutStore';
import { type Locale, useLocaleStore } from '@/core/store/localeStore';
import { tokenStorage } from '@/shared/utils/storage';
import { LayoutSettingsDrawer } from './LayoutSettingsDrawer';

const localeItems: MenuProps['items'] = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'en-US', label: 'English' },
];

export function useHeaderActions() {
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

  return [
    <Dropdown
      key="locale"
      menu={{
        items: localeItems,
        selectedKeys: [locale],
        onClick: ({ key }) => setLocale(key as Locale),
      }}
    >
      <Button type="text" icon={<TranslationOutlined />}>
        {locale === 'zh-CN' ? '简体中文' : 'English'}
      </Button>
    </Dropdown>,
    <Button
      key="theme"
      type="text"
      icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleDarkMode}
    />,
    <TrueAdminNotificationBell key="notifications" />,
    <LayoutSettingsDrawer key="settings" />,
    <Dropdown
      key="user"
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
      <Button type="text" icon={<Avatar size={24} icon={<UserOutlined />} />}>
        {data?.nickname || data?.username || '管理员'}
      </Button>
    </Dropdown>,
  ];
}
