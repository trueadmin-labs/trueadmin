import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type ClosingTabState, ENTER_ANIMATION_MS, toPixelDelta } from './AppTabsBarUtils';
import type { AppTab } from './types';

export function useEnteringTabKeys(tabs: AppTab[], closingTabs: Record<string, ClosingTabState>) {
  const seenTabKeysRef = useRef<Set<string> | undefined>(undefined);
  const [enteringKeys, setEnteringKeys] = useState<string[]>([]);

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

  return enteringKeys;
}

export function useScrollActiveTabIntoView(
  scrollRef: RefObject<HTMLUListElement | null>,
  activeKey: string | undefined,
  tabCount: number,
) {
  useEffect(() => {
    const activeNode = scrollRef.current?.querySelector<HTMLElement>(
      `[data-tab-key="${window.CSS.escape(activeKey ?? '')}"]`,
    );
    activeNode?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey, scrollRef, tabCount]);
}

export function useTabsWheelScroll(scrollRef: RefObject<HTMLUListElement | null>) {
  const handleTabsWheel = useCallback(
    (event: WheelEvent) => {
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
    },
    [scrollRef],
  );

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) {
      return;
    }

    target.addEventListener('wheel', handleTabsWheel, { passive: false });

    return () => {
      target.removeEventListener('wheel', handleTabsWheel);
    };
  }, [handleTabsWheel, scrollRef]);
}
