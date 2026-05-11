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
import { requestWorkspaceScrollTop } from '@/core/layout/workspaceScrollStore';
import { playDropBackAnimation, useTabMoveAnimation } from './AppTabsBarAnimation';
import { useAppTabsCloseActions } from './AppTabsBarClose';
import {
  restrictToHorizontalAxis,
  SortableTabGroup,
  sameGroupCollisionDetection,
  TabsMoreButton,
  useTabActions,
} from './AppTabsBarItems';
import {
  type ClosingTabState,
  ENTER_ANIMATION_MS,
  isSamePath,
  type PendingDropAnimation,
  toPixelDelta,
} from './AppTabsBarUtils';
import { useTabsStore } from './tabsStore';
import type { AppTab } from './types';

export function AppTabsBar({ activeKey }: { activeKey?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = useTabsStore((state) => state.tabs);
  const reorderTabs = useTabsStore((state) => state.reorderTabs);
  const scrollRef = useRef<HTMLUListElement>(null);
  const pendingDropAnimationRef = useRef<PendingDropAnimation | undefined>(undefined);
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

  const { requestClose, requestCloseByScope } = useAppTabsCloseActions({
    closingTabs,
    pathname: location.pathname,
    scrollRef,
    setClosingTabs,
    navigateToPath,
  });

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
