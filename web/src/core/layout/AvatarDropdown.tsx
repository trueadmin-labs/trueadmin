import { LogoutOutlined, SkinOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import React from 'react';
import { flushSync } from 'react-dom';
import { outLogin } from '@/modules/auth/services';
import { clearAccessToken } from '@/core/auth/token';
import HeaderDropdown from './HeaderDropdown';

export type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const { initialState, setInitialState } = useModel('@@initialState');

  const loginOut = async () => {
    try {
      await outLogin({ skipErrorHandler: true });
    } finally {
      clearAccessToken();
      const { search, pathname } = window.location;
      const searchParams = new URLSearchParams({
        redirect: pathname + search,
      });
      history.replace({
        pathname: '/user/login',
        search: searchParams.toString(),
      });
    }
  };

  const onMenuClick: MenuProps['onClick'] = (event) => {
    if (event.key === 'logout') {
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      loginOut();
      return;
    }

    if (event.key === 'theme') {
      setInitialState((s) => ({ ...s, settingDrawerOpen: true }));
    }
  };

  if (!initialState?.currentUser) {
    return <Spin size="small" />;
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'theme',
      icon: <SkinOutlined />,
      label: '主题设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <HeaderDropdown
      placement="bottomRight"
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      arrow
    >
      {children}
    </HeaderDropdown>
  );
};
