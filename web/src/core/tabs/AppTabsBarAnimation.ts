import { type RefObject, useLayoutEffect, useRef } from 'react';
import { type PendingDropAnimation, TAB_MOVE_ANIMATION_MS } from './AppTabsBarUtils';

export function useTabMoveAnimation(
  scrollRef: RefObject<HTMLUListElement | null>,
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

export function playDropBackAnimation(
  scrollRef: RefObject<HTMLUListElement | null>,
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
