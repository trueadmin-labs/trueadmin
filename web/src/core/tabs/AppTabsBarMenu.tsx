import {
  CloseOutlined,
  MoreOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Tooltip } from 'antd';
import { useTabsStore } from './tabsStore';
import type { TabCloseScope } from './types';

export function useTabActions({
  activeKey,
  onClose,
  onCloseByScope,
}: {
  activeKey?: string;
  onClose: (key: string) => void;
  onCloseByScope: (key: string, scope: TabCloseScope) => void;
}) {
  const refreshTab = useTabsStore((state) => state.refreshTab);
  const pinTab = useTabsStore((state) => state.pinTab);
  const unpinTab = useTabsStore((state) => state.unpinTab);
  const getMenuItems = (key: string): MenuProps['items'] => {
    const stateTabs = useTabsStore.getState().tabs;
    const target = stateTabs.find((tab) => tab.key === key);
    const targetIndex = stateTabs.findIndex((tab) => tab.key === key);
    const currentKey = key || activeKey || stateTabs[0]?.key || '';
    const normalTabs = stateTabs.filter((tab) => !tab.pinned);
    const hasLeftClosable = stateTabs.some((tab, index) => index < targetIndex && !tab.pinned);
    const hasRightClosable = stateTabs.some((tab, index) => index > targetIndex && !tab.pinned);
    const hasOtherClosable = stateTabs.some((tab) => tab.key !== currentKey && !tab.pinned);

    return [
      {
        key: 'refresh',
        icon: <ReloadOutlined />,
        label: '刷新当前',
        disabled: !currentKey,
        onClick: () => currentKey && refreshTab(currentKey),
      },
      {
        key: 'pin',
        icon: target?.pinned ? <PushpinFilled /> : <PushpinOutlined />,
        label: target?.pinned ? '取消固定' : '固定',
        disabled: target?.home,
        onClick: () => {
          if (!target || target.home) {
            return;
          }

          if (target.pinned) {
            unpinTab(target.key);
          } else {
            pinTab(target.key);
          }
        },
      },
      { type: 'divider' },
      {
        key: 'close-current',
        icon: <CloseOutlined />,
        label: '关闭当前',
        disabled: target?.pinned,
        onClick: () => currentKey && onClose(currentKey),
      },
      {
        key: 'close-left',
        label: '关闭左侧',
        disabled: !hasLeftClosable,
        onClick: () => currentKey && onCloseByScope(currentKey, 'left'),
      },
      {
        key: 'close-right',
        label: '关闭右侧',
        disabled: !hasRightClosable,
        onClick: () => currentKey && onCloseByScope(currentKey, 'right'),
      },
      {
        key: 'close-others',
        label: '关闭其它',
        disabled: !hasOtherClosable,
        onClick: () => currentKey && onCloseByScope(currentKey, 'others'),
      },
      {
        key: 'close-all',
        label: '关闭全部',
        disabled: normalTabs.length === 0,
        onClick: () => currentKey && onCloseByScope(currentKey, 'all'),
      },
    ];
  };

  return { getMenuItems };
}

export function TabsMoreButton({ menuItems }: { menuItems: MenuProps['items'] }) {
  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Tooltip title="更多操作">
        <Button className="trueadmin-tabs-more" type="text" icon={<MoreOutlined />} />
      </Tooltip>
    </Dropdown>
  );
}
