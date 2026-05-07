import type { HTMLAttributes, ReactNode, UIEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type TrueAdminScrollShadowProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  contentClassName?: string;
};

const getShadowState = (element: HTMLDivElement | null) => {
  if (!element) {
    return { bottom: false, top: false };
  }

  const maxScrollTop = element.scrollHeight - element.clientHeight;

  return {
    bottom: element.scrollTop < maxScrollTop - 1,
    top: element.scrollTop > 1,
  };
};

export function TrueAdminScrollShadow({
  children,
  className,
  contentClassName,
  onScroll,
  ...restProps
}: TrueAdminScrollShadowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shadowState, setShadowState] = useState({ bottom: false, top: false });

  const updateShadowState = useCallback(() => {
    setShadowState(getShadowState(scrollRef.current));
  }, []);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    updateShadowState();

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(updateShadowState);
    resizeObserver.observe(element);

    const firstChild = element.firstElementChild;
    if (firstChild instanceof HTMLElement) {
      resizeObserver.observe(firstChild);
    }

    return () => resizeObserver.disconnect();
  }, [updateShadowState]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    updateShadowState();
    onScroll?.(event);
  };

  return (
    <div
      {...restProps}
      className={['trueadmin-scroll-shadow', className].filter(Boolean).join(' ')}
      data-shadow-bottom={shadowState.bottom ? 'true' : 'false'}
      data-shadow-top={shadowState.top ? 'true' : 'false'}
    >
      <div
        ref={scrollRef}
        className={['trueadmin-scroll-shadow-scroller', contentClassName].filter(Boolean).join(' ')}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
}
