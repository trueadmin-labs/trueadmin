import type { CSSProperties, HTMLAttributes, ReactNode, UIEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export type TrueAdminScrollShadowClassNames = {
  root?: string;
  scroller?: string;
};

export type TrueAdminScrollShadowStyles = {
  root?: CSSProperties;
  scroller?: CSSProperties;
};

export type TrueAdminScrollShadowProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  classNames?: TrueAdminScrollShadowClassNames;
  styles?: TrueAdminScrollShadowStyles;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  disabled?: boolean;
  shadow?:
    | boolean
    | {
        bottom?: boolean;
        top?: boolean;
      };
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

const canShowShadow = (
  shadow: TrueAdminScrollShadowProps['shadow'],
  placement: 'bottom' | 'top',
) => {
  if (shadow === false) {
    return false;
  }

  if (typeof shadow === 'object') {
    return shadow[placement] !== false;
  }

  return true;
};

export function TrueAdminScrollShadow({
  children,
  className,
  classNames,
  contentClassName,
  contentStyle,
  disabled = false,
  onScroll,
  shadow = true,
  style,
  styles,
  ...restProps
}: TrueAdminScrollShadowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shadowState, setShadowState] = useState({ bottom: false, top: false });

  const updateShadowState = useCallback(() => {
    if (disabled) {
      setShadowState({ bottom: false, top: false });
      return;
    }

    setShadowState(getShadowState(scrollRef.current));
  }, [disabled]);

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
      className={['trueadmin-scroll-shadow', classNames?.root, className].filter(Boolean).join(' ')}
      style={{ ...styles?.root, ...style }}
      data-shadow-bottom={shadowState.bottom && canShowShadow(shadow, 'bottom') ? 'true' : 'false'}
      data-shadow-top={shadowState.top && canShowShadow(shadow, 'top') ? 'true' : 'false'}
    >
      <div
        ref={scrollRef}
        className={['trueadmin-scroll-shadow-scroller', classNames?.scroller, contentClassName]
          .filter(Boolean)
          .join(' ')}
        style={{ ...styles?.scroller, ...contentStyle }}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
}
