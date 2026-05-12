import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppTab, PersistedTab, TabCloseScope, TabDescriptor } from './types';

type TabsState = {
  tabs: AppTab[];
  activeKey?: string;
  ensureTab: (descriptor: TabDescriptor, options?: { active?: boolean }) => void;
  setActiveKey: (key?: string) => void;
  refreshTab: (key: string) => void;
  closeTab: (key: string) => string | undefined;
  closeTabs: (targetKey: string, scope: TabCloseScope) => string | undefined;
  pinTab: (key: string) => void;
  unpinTab: (key: string) => void;
  reorderTabs: (keys: string[], pinned: boolean) => void;
  replaceTabs: (tabs: AppTab[]) => void;
};

const now = () => Date.now();

const toTab = (descriptor: TabDescriptor): AppTab => ({
  key: descriptor.key,
  path: descriptor.path,
  title: descriptor.title,
  icon: descriptor.icon,
  pinned: descriptor.pinned ?? descriptor.home ?? false,
  home: descriptor.home ?? false,
  refreshKey: 0,
  openedAt: now(),
  pinnedAt: descriptor.pinned || descriptor.home ? now() : undefined,
});

const sortTabs = (tabs: AppTab[]) => {
  const pinned = tabs
    .filter((tab) => tab.pinned)
    .sort((left, right) => {
      if (left.home !== right.home) {
        return left.home ? -1 : 1;
      }

      return (left.pinnedAt ?? left.openedAt) - (right.pinnedAt ?? right.openedAt);
    });
  const normal = tabs
    .filter((tab) => !tab.pinned)
    .sort((left, right) => left.openedAt - right.openedAt);

  return [...pinned, ...normal];
};

const nextActiveAfterClose = (tabs: AppTab[], key: string) => {
  const index = tabs.findIndex((tab) => tab.key === key);
  if (index < 0) {
    return tabs[0]?.key;
  }

  return tabs[index + 1]?.key ?? tabs[index - 1]?.key ?? tabs[0]?.key;
};

const keepClosableByScope = (tabs: AppTab[], targetKey: string, scope: TabCloseScope) => {
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

const isSameTabState = (left: AppTab, right: AppTab) =>
  left.key === right.key &&
  left.path === right.path &&
  left.title === right.title &&
  left.icon === right.icon &&
  left.pinned === right.pinned &&
  left.home === right.home &&
  left.refreshKey === right.refreshKey &&
  left.openedAt === right.openedAt &&
  left.pinnedAt === right.pinnedAt;

const isSameTabsState = (left: AppTab[], right: AppTab[]) =>
  left.length === right.length && left.every((tab, index) => isSameTabState(tab, right[index]));

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeKey: undefined,
      ensureTab: (descriptor, options) =>
        set((state) => {
          const shouldActivate = options?.active ?? true;
          const existed = state.tabs.find((tab) => tab.key === descriptor.key);
          if (existed) {
            const nextTab = {
              ...existed,
              path: descriptor.path,
              title: descriptor.title,
              icon: descriptor.icon,
              home: existed.home || (descriptor.home ?? false),
              pinned: existed.pinned || descriptor.pinned || descriptor.home || false,
            };
            const tabs = sortTabs(
              state.tabs.map((tab) => (tab.key === descriptor.key ? nextTab : tab)),
            );

            const activeKey = shouldActivate ? descriptor.key : state.activeKey;
            if (state.activeKey === activeKey && isSameTabsState(tabs, state.tabs)) {
              return state;
            }

            return {
              activeKey,
              tabs,
            };
          }

          return {
            activeKey: shouldActivate ? descriptor.key : state.activeKey,
            tabs: sortTabs([...state.tabs, toTab(descriptor)]),
          };
        }),
      setActiveKey: (activeKey) =>
        set((state) => (state.activeKey === activeKey ? state : { activeKey })),
      refreshTab: (key) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.key === key ? { ...tab, refreshKey: tab.refreshKey + 1 } : tab,
          ),
        })),
      closeTab: (key) => {
        const state = get();
        const target = state.tabs.find((tab) => tab.key === key);
        if (!target || target.pinned) {
          return state.activeKey;
        }

        const activeKey =
          state.activeKey === key ? nextActiveAfterClose(state.tabs, key) : state.activeKey;
        set({ tabs: state.tabs.filter((tab) => tab.key !== key), activeKey });
        return activeKey;
      },
      closeTabs: (targetKey, scope) => {
        const state = get();
        const tabs = keepClosableByScope(state.tabs, targetKey, scope);
        const activeKey = tabs.some((tab) => tab.key === state.activeKey)
          ? state.activeKey
          : (tabs.find((tab) => tab.key === targetKey)?.key ?? tabs[0]?.key);
        set({ tabs, activeKey });
        return activeKey;
      },
      pinTab: (key) =>
        set((state) => ({
          tabs: sortTabs(
            state.tabs.map((tab) =>
              tab.key === key ? { ...tab, pinned: true, pinnedAt: now() } : tab,
            ),
          ),
        })),
      unpinTab: (key) =>
        set((state) => {
          const firstNormalOpenedAt = Math.min(
            ...state.tabs.filter((tab) => !tab.pinned).map((tab) => tab.openedAt),
          );
          const openedAt = Number.isFinite(firstNormalOpenedAt) ? firstNormalOpenedAt - 1 : now();

          return {
            tabs: sortTabs(
              state.tabs.map((tab) =>
                tab.key === key && !tab.home
                  ? { ...tab, pinned: false, pinnedAt: undefined, openedAt }
                  : tab,
              ),
            ),
          };
        }),
      reorderTabs: (keys, pinned) =>
        set((state) => {
          const keyed = new Map(state.tabs.map((tab) => [tab.key, tab]));
          const start = now();
          const reordered = keys
            .map((key, index) => {
              const tab = keyed.get(key);
              if (!tab || tab.pinned !== pinned || tab.home) {
                return undefined;
              }

              return pinned
                ? { ...tab, pinnedAt: start + index }
                : { ...tab, openedAt: start + index };
            })
            .filter(Boolean) as AppTab[];
          const reorderedMap = new Map(reordered.map((tab) => [tab.key, tab]));

          return {
            tabs: sortTabs(state.tabs.map((tab) => reorderedMap.get(tab.key) ?? tab)),
          };
        }),
      replaceTabs: (tabs) =>
        set((state) => {
          const sortedTabs = sortTabs(tabs);

          return isSameTabsState(sortedTabs, state.tabs) ? state : { tabs: sortedTabs };
        }),
    }),
    {
      name: 'trueadmin.tabs',
      partialize: (state) => ({
        tabs: state.tabs.map(({ icon: _icon, ...tab }) => tab satisfies PersistedTab),
      }),
      merge: (persisted, current) => {
        const state = persisted as { tabs?: PersistedTab[] } | undefined;

        return {
          ...current,
          tabs: state?.tabs?.map((tab) => ({ ...tab, icon: undefined })) ?? [],
          activeKey: undefined,
        };
      },
    },
  ),
);
