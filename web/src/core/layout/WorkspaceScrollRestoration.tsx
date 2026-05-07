import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import {
  getWorkspaceScroll,
  saveWorkspaceScroll,
  subscribeWorkspaceScrollTop,
} from './workspaceScrollStore';

type WorkspaceScrollRestorationProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  scrollKey: string;
};

export function WorkspaceScrollRestoration({
  containerRef,
  scrollKey,
}: WorkspaceScrollRestorationProps) {
  const scrollKeyRef = useRef(scrollKey);

  useEffect(() => {
    scrollKeyRef.current = scrollKey;
  }, [scrollKey]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const position = getWorkspaceScroll(scrollKey);
    container.scrollTo({
      left: position?.left ?? 0,
      top: position?.top ?? 0,
      behavior: 'instant',
    });
  }, [containerRef, scrollKey]);

  useEffect(() => {
    const unsubscribe = subscribeWorkspaceScrollTop((key) => {
      if (key !== scrollKeyRef.current) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      saveWorkspaceScroll(key, { left: 0, top: 0 });
      container.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    });

    return unsubscribe;
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        saveWorkspaceScroll(scrollKeyRef.current, {
          left: container.scrollLeft,
          top: container.scrollTop,
        });
      });
    };

    container.addEventListener('scroll', save, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      saveWorkspaceScroll(scrollKeyRef.current, {
        left: container.scrollLeft,
        top: container.scrollTop,
      });
      container.removeEventListener('scroll', save);
    };
  }, [containerRef]);

  return null;
}
