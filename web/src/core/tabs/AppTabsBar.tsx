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
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTabsStore } from './tabsStore';
import type { AppTab, TabCloseScope } from './types';

const CLOSE_ANIMATION_MS = 220;
const ENTER_ANIMATION_MS = 180;
const TAB_MOVE_ANIMATION_MS = 180;

const getGroup = (tab?: AppTab) => (tab?.pinned ? 'pinned' : 'normal');

type PendingDropAnimation = {
  key: string;
  deltaX: number;
  deltaY: number;
};

type PendingClose = {
  key: string;
  path: string;
  scope?: TabCloseScope;
};

type ClosingTabState = {
  width: number;
  closing: boolean;
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

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const isSamePath = (left: string, right: string) => normalizePath(left) === normalizePath(right);

const getNextTabAfterClose = (tabs: AppTab[], key: string) => {
  const index = tabs.findIndex((tab) => tab.key === key);
  const candidates = tabs.filter((tab) => tab.key !== key);

  if (index < 0) {
    return candidates[0];
  }

  return (
    candidates[index] ??
    candidates[index - 1] ??
    candidates.find((tab) => tab.home) ??
    candidates[0]
  );
};

const keepTabsByCloseScope = (tabs: AppTab[], targetKey: string, scope: TabCloseScope) => {
  const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);

  return tabs.filter((tab, index) => {
    if (tab.pinned) {
      return true;
    }

    if (scope === 'all') {
      return false;
    }

    if (scope === 'others') {
      return tab.key === targetKey;
    }

    if (scope === 'left') {
      return targetIndex < 0 || index >= targetIndex;
    }

    if (scope === 'right') {
      return targetIndex < 0 || index <= targetIndex;
    }

    return tab.key !== targetKey;
  });
};

function useTabActions({
  activeKey,
  onClose,
  onCloseByScope,
}: {
  activeKey?: string;
  onClose: (key: string) => void;
  onCloseByScope: (key: string, scope: TabCloseScope) => void;
}) {
  const tabs = useTabsStore((state) => state.tabs);
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

  return {
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
  entering,
  closingState,
  tab,
  menuItems,
  onActivate,
  onClose,
}: {
  active: boolean;
  entering: boolean;
  closingState?: ClosingTabState;
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
  closingTabs,
  enteringKeys,
  tabs,
  getMenuItems,
  onActivate,
  onClose,
}: {
  activeKey?: string;
  closingTabs: Record<string, ClosingTabState>;
  enteringKeys: string[];
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
          entering={enteringKeys.includes(tab.key)}
          closingState={closingTabs[tab.key]}
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
  const closeTab = useTabsStore((state) => state.closeTab);
  const closeTabs = useTabsStore((state) => state.closeTabs);
  const reorderTabs = useTabsStore((state) => state.reorderTabs);
  const scrollRef = useRef<HTMLUListElement>(null);
  const pendingDropAnimationRef = useRef<PendingDropAnimation | undefined>(undefined);
  const pendingCloseRef = useRef<PendingClose | undefined>(undefined);
  const closeAnimationTimersRef = useRef(new Map<string, number | undefined>());
  const seenTabKeysRef = useRef<Set<string> | undefined>(undefined);
  const [closingTabs, setClosingTabs] = useState<Record<string, ClosingTabState>>({});
  const [enteringKeys, setEnteringKeys] = useState<string[]>([]);
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

  const getTabNode = useCallback(
    (key: string) =>
      scrollRef.current?.querySelector<HTMLElement>(`[data-tab-key="${window.CSS.escape(key)}"]`),
    [],
  );

  const startCloseAnimation = useCallback(
    (pending: PendingClose) => {
      if (closeAnimationTimersRef.current.has(pending.key)) {
        return;
      }
      closeAnimationTimersRef.current.set(pending.key, undefined);

      const width = Math.ceil(getTabNode(pending.key)?.getBoundingClientRect().width ?? 0);
      const initialWidth = width > 0 ? width : 88;

      setClosingTabs((items) => ({
        ...items,
        [pending.key]: { width: initialWidth, closing: false },
      }));

      window.requestAnimationFrame(() => {
        getTabNode(pending.key)?.getBoundingClientRect();
        setClosingTabs((items) => ({
          ...items,
          [pending.key]: { width: initialWidth, closing: true },
        }));

        const timer = window.setTimeout(() => {
          if (pending.scope) {
            closeTabs(pending.key, pending.scope);
          } else {
            closeTab(pending.key);
          }
          closeAnimationTimersRef.current.delete(pending.key);
          setClosingTabs((items) => {
            const { [pending.key]: _removed, ...nextItems } = items;
            return nextItems;
          });
        }, CLOSE_ANIMATION_MS);

        closeAnimationTimersRef.current.set(pending.key, timer);
      });
    },
    [closeTab, closeTabs, getTabNode],
  );

  const navigateToPath = useCallback(
    (path?: string) => {
      if (path && !isSamePath(location.pathname, path)) {
        navigate(path);
        return true;
      }

      return false;
    },
    [location.pathname, navigate],
  );

  const requestClose = useCallback(
    (key: string) => {
      const state = useTabsStore.getState();
      const tab = state.tabs.find((item) => item.key === key);
      if (!tab || tab.pinned || closingTabs[key]) {
        return;
      }

      if (isSamePath(location.pathname, tab.path)) {
        const nextTab = getNextTabAfterClose(state.tabs, key);
        pendingCloseRef.current = { key, path: tab.path };

        if (!navigateToPath(nextTab?.path)) {
          pendingCloseRef.current = undefined;
          startCloseAnimation({ key, path: tab.path });
        }
        return;
      }

      startCloseAnimation({ key, path: tab.path });
    },
    [closingTabs, location.pathname, navigateToPath, startCloseAnimation],
  );

  const requestCloseByScope = useCallback(
    (key: string, scope: TabCloseScope) => {
      const state = useTabsStore.getState();
      const currentTab = state.tabs.find((tab) => isSamePath(location.pathname, tab.path));
      const nextTabs = keepTabsByCloseScope(state.tabs, key, scope);
      const shouldNavigateBeforeClose = Boolean(
        currentTab && !nextTabs.some((tab) => tab.key === currentTab.key),
      );
      const nextTab = nextTabs.find((tab) => tab.key === key) ?? nextTabs[0];

      if (shouldNavigateBeforeClose) {
        pendingCloseRef.current = { key, path: currentTab?.path ?? '', scope };
        if (!navigateToPath(nextTab?.path)) {
          pendingCloseRef.current = undefined;
          closeTabs(key, scope);
        }
        return;
      }

      closeTabs(key, scope);
    },
    [closeTabs, location.pathname, navigateToPath],
  );

  const { getMenuItems } = useTabActions({
    activeKey,
    onClose: requestClose,
    onCloseByScope: requestCloseByScope,
  });

  const takePendingDropAnimation = useCallback(() => {
    const pending = pendingDropAnimationRef.current;
    pendingDropAnimationRef.current = undefined;
    return pending;
  }, []);

  useTabMoveAnimation(scrollRef, tabLayoutKey, takePendingDropAnimation);

  useLayoutEffect(() => {
    const nextKeys = new Set(tabs.map((tab) => tab.key));
    const previousKeys = seenTabKeysRef.current;

    if (!previousKeys) {
      seenTabKeysRef.current = nextKeys;
      return;
    }

    const newKeys = tabs
      .map((tab) => tab.key)
      .filter((key) => !previousKeys.has(key) && !closingTabs[key]);

    seenTabKeysRef.current = nextKeys;
    if (newKeys.length === 0) {
      return;
    }

    setEnteringKeys((keys) => Array.from(new Set([...keys, ...newKeys])));
    const timer = window.setTimeout(() => {
      setEnteringKeys((keys) => keys.filter((key) => !newKeys.includes(key)));
    }, ENTER_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [closingTabs, tabs]);

  useEffect(() => {
    const pending = pendingCloseRef.current;
    if (!pending || isSamePath(location.pathname, pending.path)) {
      return;
    }

    pendingCloseRef.current = undefined;
    startCloseAnimation(pending);
  }, [location.pathname, startCloseAnimation]);

  useEffect(() => {
    const activeNode = scrollRef.current?.querySelector<HTMLElement>(
      `[data-tab-key="${window.CSS.escape(activeKey ?? '')}"]`,
    );
    activeNode?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey, tabs.length]);

  const activateTab = (tab: AppTab) => {
    if (!isSamePath(location.pathname, tab.path)) {
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
            closingTabs={closingTabs}
            enteringKeys={enteringKeys}
            tabs={pinnedTabs}
            getMenuItems={getMenuItems}
            onActivate={activateTab}
            onClose={requestClose}
          />
          {pinnedTabs.length > 0 && normalTabs.length > 0 ? (
            <li className="trueadmin-tabs-group-divider" aria-hidden="true" />
          ) : null}
          <SortableTabGroup
            activeKey={activeKey}
            closingTabs={closingTabs}
            enteringKeys={enteringKeys}
            tabs={normalTabs}
            getMenuItems={getMenuItems}
            onActivate={activateTab}
            onClose={requestClose}
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
