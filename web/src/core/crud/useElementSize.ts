import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type ElementSizeOptions = {
  paused?: boolean;
};

export const useElementSize = <TElement extends HTMLElement>({
  paused = false,
}: ElementSizeOptions = {}) => {
  const ref = useRef<TElement | null>(null);
  const pausedRef = useRef(paused);
  const [size, setSize] = useState({ height: 0, width: 0 });

  pausedRef.current = paused;

  const measureSize = useCallback(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const nextSize = {
      height: Math.floor(rect.height),
      width: Math.floor(rect.width),
    };
    setSize((currentSize) =>
      currentSize.height === nextSize.height && currentSize.width === nextSize.width
        ? currentSize
        : nextSize,
    );
  }, []);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      if (!pausedRef.current) {
        measureSize();
      }
    };

    measureSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureSize]);

  return [ref, size, measureSize] as const;
};
