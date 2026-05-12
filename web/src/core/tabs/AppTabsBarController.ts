import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { requestWorkspaceScrollTop } from '@/core/layout/workspaceScrollStore';
import { playDropBackAnimation, useTabMoveAnimation } from './AppTabsBarAnimation';
import { useAppTabsCloseActions } from './AppTabsBarClose';
import {
  useEnteringTabKeys,
  useScrollActiveTabIntoView,
  useTabsWheelScroll,
} from './AppTabsBarEffects';
import { useTabActions } from './AppTabsBarItems';
import { type ClosingTabState, isSamePath, type PendingDropAnimation } from './AppTabsBarUtils';
import { useTabsStore } from './tabsStore';
import type { AppTab } from './types';

export function useAppTabsBarController(activeKey?: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = useTabsStore((state) => state.tabs);
  const reorderTabs = useTabsStore((state) => state.reorderTabs);
  const scrollRef = useRef<HTMLUListElement>(null);
  const pendingDropAnimationRef = useRef<PendingDropAnimation | undefined>(undefined);
  const [closingTabs, setClosingTabs] = useState<Record<string, ClosingTabState>>({});
  const enteringKeys = useEnteringTabKeys(tabs, closingTabs);
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
  useScrollActiveTabIntoView(scrollRef, activeKey, tabs.length);
  useTabsWheelScroll(scrollRef);

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

  return {
    closingTabs,
    enteringKeys,
    getMenuItems,
    handleDragEnd,
    normalTabs,
    pinnedTabs,
    scrollActiveTabToTop,
    scrollRef,
    sensors,
    tabs,
    activateTab,
    requestClose,
  };
}
