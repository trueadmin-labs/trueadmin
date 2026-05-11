import type { AppTab, TabCloseScope } from './types';

export const CLOSE_ANIMATION_MS = 220;
export const ENTER_ANIMATION_MS = 180;
export const TAB_MOVE_ANIMATION_MS = 180;

export type PendingDropAnimation = {
  key: string;
  deltaX: number;
  deltaY: number;
};

export type PendingClose = {
  key: string;
  path: string;
  scope?: TabCloseScope;
};

export type ClosingTabState = {
  width: number;
  closing: boolean;
};

export const getGroup = (tab?: AppTab) => (tab?.pinned ? 'pinned' : 'normal');

export const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const isSamePath = (left: string, right: string) =>
  normalizePath(left) === normalizePath(right);

export const toPixelDelta = (event: WheelEvent, target: HTMLElement) => {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * target.clientWidth;
  }

  return event.deltaY;
};

export const getNextTabAfterClose = (tabs: AppTab[], key: string) => {
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

export const keepTabsByCloseScope = (tabs: AppTab[], targetKey: string, scope: TabCloseScope) => {
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
