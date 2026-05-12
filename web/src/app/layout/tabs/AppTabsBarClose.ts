import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  removeWorkspaceScroll,
  removeWorkspaceScrollExcept,
} from '@/core/layout/workspaceScrollStore';
import {
  CLOSE_ANIMATION_MS,
  type ClosingTabState,
  getNextTabAfterClose,
  isSamePath,
  keepTabsByCloseScope,
  type PendingClose,
} from './AppTabsBarUtils';
import { useTabsStore } from './tabsStore';
import type { AppTab, TabCloseScope } from './types';

type UseAppTabsCloseActionsOptions = {
  closingTabs: Record<string, ClosingTabState>;
  pathname: string;
  scrollRef: RefObject<HTMLUListElement | null>;
  setClosingTabs: Dispatch<SetStateAction<Record<string, ClosingTabState>>>;
  navigateToPath: (path?: string) => boolean;
};

export function useAppTabsCloseActions({
  closingTabs,
  pathname,
  scrollRef,
  setClosingTabs,
  navigateToPath,
}: UseAppTabsCloseActionsOptions) {
  const closeTab = useTabsStore((state) => state.closeTab);
  const closeTabs = useTabsStore((state) => state.closeTabs);
  const pendingCloseRef = useRef<PendingClose | undefined>(undefined);
  const closeAnimationTimersRef = useRef(new Map<string, number | undefined>());

  const getTabNode = useCallback(
    (key: string) =>
      scrollRef.current?.querySelector<HTMLElement>(`[data-tab-key="${window.CSS.escape(key)}"]`),
    [scrollRef],
  );

  const removeClosedScopeScroll = useCallback((beforeCloseTabs: AppTab[]) => {
    const remainingKeys = useTabsStore.getState().tabs.map((tab) => tab.key);
    removeWorkspaceScrollExcept(remainingKeys);
    for (const tab of beforeCloseTabs) {
      if (!remainingKeys.includes(tab.key)) {
        removeWorkspaceScroll(tab.path);
      }
    }
  }, []);

  const closeTabsByScope = useCallback(
    (key: string, scope: TabCloseScope) => {
      const beforeCloseTabs = useTabsStore.getState().tabs;
      closeTabs(key, scope);
      removeClosedScopeScroll(beforeCloseTabs);
    },
    [closeTabs, removeClosedScopeScroll],
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
            closeTabsByScope(pending.key, pending.scope);
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
    [closeTab, closeTabsByScope, getTabNode, setClosingTabs],
  );

  const requestClose = useCallback(
    (key: string) => {
      const state = useTabsStore.getState();
      const tab = state.tabs.find((item) => item.key === key);
      if (!tab || tab.pinned || closingTabs[key]) {
        return;
      }

      if (isSamePath(pathname, tab.path)) {
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
    [closingTabs, pathname, navigateToPath, startCloseAnimation],
  );

  const requestCloseByScope = useCallback(
    (key: string, scope: TabCloseScope) => {
      const state = useTabsStore.getState();
      const currentTab = state.tabs.find((tab) => isSamePath(pathname, tab.path));
      const nextTabs = keepTabsByCloseScope(state.tabs, key, scope);
      const shouldNavigateBeforeClose = Boolean(
        currentTab && !nextTabs.some((tab) => tab.key === currentTab.key),
      );
      const nextTab = nextTabs.find((tab) => tab.key === key) ?? nextTabs[0];

      if (shouldNavigateBeforeClose) {
        pendingCloseRef.current = { key, path: currentTab?.path ?? '', scope };
        if (!navigateToPath(nextTab?.path)) {
          pendingCloseRef.current = undefined;
          closeTabsByScope(key, scope);
        }
        return;
      }

      closeTabsByScope(key, scope);
    },
    [closeTabsByScope, pathname, navigateToPath],
  );

  useEffect(() => {
    const pending = pendingCloseRef.current;
    if (!pending || isSamePath(pathname, pending.path)) {
      return;
    }

    pendingCloseRef.current = undefined;
    startCloseAnimation(pending);
  }, [pathname, startCloseAnimation]);

  return { requestClose, requestCloseByScope };
}
