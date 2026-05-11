import {
  CloseOutlined,
  MoreOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { type CollisionDetection, closestCenter, type Modifier } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import { TrueAdminIcon } from '@/core/icon/TrueAdminIcon';
import { type ClosingTabState, getGroup } from './AppTabsBarUtils';
import { useTabsStore } from './tabsStore';
import type { AppTab, TabCloseScope } from './types';

export const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
});

export const sameGroupCollisionDetection: CollisionDetection = (args) => {
  const activeGroup = args.active.data.current?.group;
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.data.current?.group === activeGroup,
  );

  return closestCenter({ ...args, droppableContainers });
};

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

function SortableTab({
  active,
  entering,
  closingState,
  tab,
  menuItems,
  onActivate,
  onClose,
  onScrollTop,
}: {
  active: boolean;
  entering: boolean;
  closingState?: ClosingTabState;
  tab: AppTab;
  menuItems: MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
  onScrollTop: (tab: AppTab) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.key,
    disabled: tab.home,
    data: { group: getGroup(tab) },
  });
  const stateTransition = [
    transition,
    'background-color 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'border-color 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'box-shadow 0.18s cubic-bezier(0.2, 0, 0, 1)',
    'color 0.18s cubic-bezier(0.2, 0, 0, 1)',
  ]
    .filter(Boolean)
    .join(', ');
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition: closingState ? undefined : stateTransition,
    '--trueadmin-tabs-closing-width': closingState ? `${closingState.width}px` : undefined,
  } as CSSProperties;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <li
        ref={setNodeRef}
        className="trueadmin-tabs-item"
        data-active={active}
        data-entering={entering}
        data-closing={closingState?.closing ?? false}
        data-closing-ready={Boolean(closingState)}
        data-dragging={isDragging}
        data-pinned={tab.pinned}
        data-tab-key={tab.key}
        style={style}
        title={tab.title}
        {...attributes}
        {...listeners}
        onMouseDown={(event) => {
          if (event.button === 1 && !tab.pinned) {
            event.preventDefault();
            onClose(tab.key);
          }
        }}
      >
        <button
          className="trueadmin-tabs-button"
          type="button"
          onClick={() => onActivate(tab)}
          onDoubleClick={() => {
            if (active) {
              onScrollTop(tab);
            }
          }}
        >
          {tab.pinned ? (
            <span className="trueadmin-tabs-pin-slot" aria-hidden="true">
              <PushpinFilled />
            </span>
          ) : null}
          <span className="trueadmin-tabs-icon-slot" aria-hidden="true">
            <TrueAdminIcon icon={tab.icon} />
          </span>
          <span className="trueadmin-tabs-title">{tab.title}</span>
        </button>
        <button
          className="trueadmin-tabs-close"
          type="button"
          aria-label={`关闭 ${tab.title}`}
          disabled={tab.pinned}
          onClick={(event) => {
            event.stopPropagation();
            onClose(tab.key);
          }}
        >
          <CloseOutlined />
        </button>
      </li>
    </Dropdown>
  );
}

export function SortableTabGroup({
  activeKey,
  closingTabs,
  enteringKeys,
  tabs,
  getMenuItems,
  onActivate,
  onClose,
  onScrollTop,
}: {
  activeKey?: string;
  closingTabs: Record<string, ClosingTabState>;
  enteringKeys: string[];
  tabs: AppTab[];
  getMenuItems: (key: string) => MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
  onScrollTop: (tab: AppTab) => void;
}) {
  return (
    <SortableContext items={tabs.map((tab) => tab.key)} strategy={horizontalListSortingStrategy}>
      {tabs.map((tab) => (
        <SortableTab
          key={tab.key}
          active={tab.key === activeKey}
          entering={enteringKeys.includes(tab.key)}
          closingState={closingTabs[tab.key]}
          tab={tab}
          menuItems={getMenuItems(tab.key)}
          onActivate={onActivate}
          onClose={onClose}
          onScrollTop={onScrollTop}
        />
      ))}
    </SortableContext>
  );
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
