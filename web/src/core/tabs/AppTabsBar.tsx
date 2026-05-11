import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  removeWorkspaceScroll,
  removeWorkspaceScrollExcept,
  requestWorkspaceScrollTop,
} from '@/core/layout/workspaceScrollStore';
import { playDropBackAnimation, useTabMoveAnimation } from './AppTabsBarAnimation';
import {
  restrictToHorizontalAxis,
  SortableTabGroup,
  sameGroupCollisionDetection,
  TabsMoreButton,
  useTabActions,
} from './AppTabsBarItems';
import {
  CLOSE_ANIMATION_MS,
  type ClosingTabState,
  ENTER_ANIMATION_MS,
  getNextTabAfterClose,
  isSamePath,
  keepTabsByCloseScope,
  type PendingClose,
  type PendingDropAnimation,
  toPixelDelta,
} from './AppTabsBarUtils';
import { useTabsStore } from './tabsStore';
import type { AppTab, TabCloseScope } from './types';

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
            const beforeCloseTabs = useTabsStore.getState().tabs;
            closeTabs(pending.key, pending.scope);
            const remainingKeys = useTabsStore.getState().tabs.map((tab) => tab.key);
            removeWorkspaceScrollExcept(remainingKeys);
            for (const tab of beforeCloseTabs) {
              if (!remainingKeys.includes(tab.key)) {
                removeWorkspaceScroll(tab.path);
              }
            }
          } else {
            closeTab(pending.key);
            removeWorkspaceScroll(pending.key);
            removeWorkspaceScroll(pending.path);
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
          const beforeCloseTabs = useTabsStore.getState().tabs;
          closeTabs(key, scope);
          const remainingKeys = useTabsStore.getState().tabs.map((tab) => tab.key);
          removeWorkspaceScrollExcept(remainingKeys);
          for (const tab of beforeCloseTabs) {
            if (!remainingKeys.includes(tab.key)) {
              removeWorkspaceScroll(tab.path);
            }
          }
        }
        return;
      }

      const beforeCloseTabs = useTabsStore.getState().tabs;
      closeTabs(key, scope);
      const remainingKeys = useTabsStore.getState().tabs.map((tab) => tab.key);
      removeWorkspaceScrollExcept(remainingKeys);
      for (const tab of beforeCloseTabs) {
        if (!remainingKeys.includes(tab.key)) {
          removeWorkspaceScroll(tab.path);
        }
      }
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

  const scrollActiveTabToTop = (tab: AppTab) => {
    if (tab.key === activeKey) {
      requestWorkspaceScrollTop(tab.key);
    }
  };

  const handleTabsWheel = useCallback((event: WheelEvent) => {
    const target = scrollRef.current;
    if (!target) {
      return;
    }

    const maxScrollLeft = target.scrollWidth - target.clientWidth;
    if (maxScrollLeft <= 0 || event.deltaY === 0) {
      return;
    }

    const delta = toPixelDelta(event, target);
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, target.scrollLeft + delta));
    if (nextScrollLeft === target.scrollLeft) {
      return;
    }

    event.preventDefault();
    target.scrollLeft = nextScrollLeft;
  }, []);

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) {
      return;
    }

    target.addEventListener('wheel', handleTabsWheel, { passive: false });

    return () => {
      target.removeEventListener('wheel', handleTabsWheel);
    };
  }, [handleTabsWheel]);

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
            onScrollTop={scrollActiveTabToTop}
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
            onScrollTop={scrollActiveTabToTop}
          />
        </ul>
      </DndContext>
      <TabsMoreButton menuItems={getMenuItems(activeKey ?? tabs[0]?.key ?? '')} />
    </nav>
  );
}
