import {
  CloseOutlined,
  MoreOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Tooltip } from 'antd';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTabsStore } from './tabsStore';
import type { AppTab, TabCloseScope } from './types';

const CLOSE_ANIMATION_MS = 150;
const TAB_MOVE_ANIMATION_MS = 180;

const getGroup = (tab?: AppTab) => (tab?.pinned ? 'pinned' : 'normal');

type PendingDropAnimation = {
  key: string;
  deltaX: number;
  deltaY: number;
};

const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
});

const sameGroupCollisionDetection: CollisionDetection = (args) => {
  const activeGroup = args.active.data.current?.group;
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.data.current?.group === activeGroup,
  );

  return closestCenter({ ...args, droppableContainers });
};

function useTabActions(activeKey?: string) {
  const navigate = useNavigate();
  const tabs = useTabsStore((state) => state.tabs);
  const refreshTab = useTabsStore((state) => state.refreshTab);
  const closeTab = useTabsStore((state) => state.closeTab);
  const closeTabs = useTabsStore((state) => state.closeTabs);
  const pinTab = useTabsStore((state) => state.pinTab);
  const unpinTab = useTabsStore((state) => state.unpinTab);
  const [closingKeys, setClosingKeys] = useState<string[]>([]);

  const navigateToKey = (key?: string) => {
    const nextTab = useTabsStore.getState().tabs.find((tab) => tab.key === key);
    if (nextTab) {
      navigate(nextTab.path);
    }
  };

  const closeWithAnimation = (key: string) => {
    const tab = useTabsStore.getState().tabs.find((item) => item.key === key);
    if (!tab || tab.pinned || closingKeys.includes(key)) {
      return;
    }

    setClosingKeys((keys) => [...keys, key]);
    window.setTimeout(() => {
      const nextKey = closeTab(key);
      navigateToKey(nextKey);
      setClosingKeys((keys) => keys.filter((item) => item !== key));
    }, CLOSE_ANIMATION_MS);
  };

  const closeByScope = (key: string, scope: TabCloseScope) => {
    const nextKey = closeTabs(key, scope);
    navigateToKey(nextKey);
  };

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
        onClick: () => currentKey && closeWithAnimation(currentKey),
      },
      {
        key: 'close-left',
        label: '关闭左侧',
        disabled: !hasLeftClosable,
        onClick: () => currentKey && closeByScope(currentKey, 'left'),
      },
      {
        key: 'close-right',
        label: '关闭右侧',
        disabled: !hasRightClosable,
        onClick: () => currentKey && closeByScope(currentKey, 'right'),
      },
      {
        key: 'close-others',
        label: '关闭其它',
        disabled: !hasOtherClosable,
        onClick: () => currentKey && closeByScope(currentKey, 'others'),
      },
      {
        key: 'close-all',
        label: '关闭全部',
        disabled: normalTabs.length === 0,
        onClick: () => currentKey && closeByScope(currentKey, 'all'),
      },
    ];
  };

  return {
    closingKeys,
    closeWithAnimation,
    getMenuItems,
    refreshTab,
    tabs,
  };
}

function useTabMoveAnimation(
  scrollRef: React.RefObject<HTMLUListElement | null>,
  layoutKey: string,
  takePendingDropAnimation: () => PendingDropAnimation | undefined,
) {
  const rectsRef = useRef(new Map<string, { pinned: boolean; rect: DOMRect }>());

  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pendingDropAnimation = takePendingDropAnimation();
    const previousRects = rectsRef.current;
    const nextRects = new Map<string, { pinned: boolean; rect: DOMRect }>();
    const nodes = Array.from(scroll.querySelectorAll<HTMLElement>('.trueadmin-tabs-item'));

    for (const node of nodes) {
      const key = node.dataset.tabKey;
      if (!key) {
        continue;
      }

      const nextRect = node.getBoundingClientRect();
      const pinned = node.dataset.pinned === 'true';
      nextRects.set(key, { pinned, rect: nextRect });

      const previous = previousRects.get(key);
      if (!previous || reduceMotion || node.dataset.dragging === 'true') {
        continue;
      }

      if (pendingDropAnimation && pendingDropAnimation.key !== key) {
        continue;
      }

      if (!pendingDropAnimation && previous.pinned === pinned) {
        continue;
      }

      const deltaX = pendingDropAnimation
        ? previous.rect.left + pendingDropAnimation.deltaX - nextRect.left
        : previous.rect.left - nextRect.left;
      const deltaY = pendingDropAnimation
        ? previous.rect.top + pendingDropAnimation.deltaY - nextRect.top
        : 0;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        continue;
      }

      node.animate(
        [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
        {
          duration: TAB_MOVE_ANIMATION_MS,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
        },
      );
    }

    rectsRef.current = nextRects;
  }, [layoutKey, scrollRef, takePendingDropAnimation]);
}

function playDropBackAnimation(
  scrollRef: React.RefObject<HTMLUListElement | null>,
  key: string,
  deltaX: number,
) {
  if (Math.abs(deltaX) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const node = scrollRef.current?.querySelector<HTMLElement>(
    `[data-tab-key="${window.CSS.escape(key)}"]`,
  );
  node?.animate([{ transform: `translate(${deltaX}px, 0)` }, { transform: 'translate(0, 0)' }], {
    duration: TAB_MOVE_ANIMATION_MS,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  });
}

function SortableTab({
  active,
  closing,
  tab,
  menuItems,
  onActivate,
  onClose,
}: {
  active: boolean;
  closing: boolean;
  tab: AppTab;
  menuItems: MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.key,
    disabled: tab.home,
    data: { group: getGroup(tab) },
  });
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
  };

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <li
        ref={setNodeRef}
        className="trueadmin-tabs-item"
        data-active={active}
        data-closing={closing}
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
        <button className="trueadmin-tabs-button" type="button" onClick={() => onActivate(tab)}>
          {tab.pinned ? (
            <span className="trueadmin-tabs-pin-slot" aria-hidden="true">
              <PushpinFilled />
            </span>
          ) : null}
          <span className="trueadmin-tabs-icon-slot" aria-hidden="true">
            {tab.icon}
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

function SortableTabGroup({
  activeKey,
  closingKeys,
  tabs,
  getMenuItems,
  onActivate,
  onClose,
}: {
  activeKey?: string;
  closingKeys: string[];
  tabs: AppTab[];
  getMenuItems: (key: string) => MenuProps['items'];
  onActivate: (tab: AppTab) => void;
  onClose: (key: string) => void;
}) {
  return (
    <SortableContext items={tabs.map((tab) => tab.key)} strategy={horizontalListSortingStrategy}>
      {tabs.map((tab) => (
        <SortableTab
          key={tab.key}
          active={tab.key === activeKey}
          closing={closingKeys.includes(tab.key)}
          tab={tab}
          menuItems={getMenuItems(tab.key)}
          onActivate={onActivate}
          onClose={onClose}
        />
      ))}
    </SortableContext>
  );
}

export function AppTabsBar({ activeKey }: { activeKey?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = useTabsStore((state) => state.tabs);
  const reorderTabs = useTabsStore((state) => state.reorderTabs);
  const scrollRef = useRef<HTMLUListElement>(null);
  const pendingDropAnimationRef = useRef<PendingDropAnimation | undefined>(undefined);
  const { closingKeys, closeWithAnimation, getMenuItems } = useTabActions(activeKey);
  const pinnedTabs = useMemo(() => tabs.filter((tab) => tab.pinned), [tabs]);
  const normalTabs = useMemo(() => tabs.filter((tab) => !tab.pinned), [tabs]);
  const tabLayoutKey = useMemo(
    () =>
      tabs
        .map((tab) =>
          [tab.key, tab.pinned ? 'pinned' : 'normal', tab.openedAt, tab.pinnedAt].join(':'),
        )
        .join('|'),
    [tabs],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const takePendingDropAnimation = useCallback(() => {
    const pending = pendingDropAnimationRef.current;
    pendingDropAnimationRef.current = undefined;
    return pending;
  }, []);

  useTabMoveAnimation(scrollRef, tabLayoutKey, takePendingDropAnimation);

  useEffect(() => {
    const activeNode = scrollRef.current?.querySelector<HTMLElement>(
      `[data-tab-key="${window.CSS.escape(activeKey ?? '')}"]`,
    );
    activeNode?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey, tabs.length]);

  const activateTab = (tab: AppTab) => {
    if (location.pathname !== tab.path) {
      navigate(tab.path);
    }
  };

  const handleDragEnd = ({ active, delta, over }: DragEndEvent) => {
    const activeKey = String(active.id);
    const playBack = () => playDropBackAnimation(scrollRef, activeKey, delta.x);

    if (!over || active.id === over.id) {
      playBack();
      return;
    }

    const activeTab = tabs.find((tab) => tab.key === active.id);
    const overTab = tabs.find((tab) => tab.key === over.id);
    if (!activeTab || !overTab || activeTab.home || activeTab.pinned !== overTab.pinned) {
      playBack();
      return;
    }

    const groupTabs = (activeTab.pinned ? pinnedTabs : normalTabs).filter((tab) => !tab.home);
    const oldIndex = groupTabs.findIndex((tab) => tab.key === active.id);
    const newIndex = groupTabs.findIndex((tab) => tab.key === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      playBack();
      return;
    }

    const orderedKeys = [...groupTabs.map((tab) => tab.key)];
    const [moved] = orderedKeys.splice(oldIndex, 1);
    orderedKeys.splice(newIndex, 0, moved);
    pendingDropAnimationRef.current = {
      key: activeKey,
      deltaX: delta.x,
      deltaY: 0,
    };
    reorderTabs(orderedKeys, activeTab.pinned);
  };
  return (
    <nav className="trueadmin-shell-tabs" aria-label="页面标签栏">
      <DndContext
        sensors={sensors}
        collisionDetection={sameGroupCollisionDetection}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        <ul ref={scrollRef} className="trueadmin-tabs-scroll">
          <SortableTabGroup
            activeKey={activeKey}
            closingKeys={closingKeys}
            tabs={pinnedTabs}
            getMenuItems={getMenuItems}
            onActivate={activateTab}
            onClose={closeWithAnimation}
          />
          {pinnedTabs.length > 0 && normalTabs.length > 0 ? (
            <li className="trueadmin-tabs-group-divider" aria-hidden="true" />
          ) : null}
          <SortableTabGroup
            activeKey={activeKey}
            closingKeys={closingKeys}
            tabs={normalTabs}
            getMenuItems={getMenuItems}
            onActivate={activateTab}
            onClose={closeWithAnimation}
          />
        </ul>
      </DndContext>
      <Dropdown menu={{ items: getMenuItems(activeKey ?? tabs[0]?.key ?? '') }} trigger={['click']}>
        <Tooltip title="更多操作">
          <Button className="trueadmin-tabs-more" type="text" icon={<MoreOutlined />} />
        </Tooltip>
      </Dropdown>
    </nav>
  );
}
