import { Spin, Typography } from 'antd';
import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { useLayoutStore } from '@/core/store/layoutStore';

export type TrueAdminLoadingContainerMode = 'spin' | 'none';

export type TrueAdminLoadingContainerLayout = 'content' | 'viewport';

export type TrueAdminLoadingContainerProps = {
  loading?: boolean;
  children: ReactNode;
  tip?: ReactNode;
  initialLoadingHeight?: number | string;
  viewportHeight?: number | string;
  layout?: TrueAdminLoadingContainerLayout;
  mode?: TrueAdminLoadingContainerMode;
  fallback?: ReactNode;
  keepChildren?: boolean;
  reserveHeight?: boolean;
  animateHeight?: boolean;
  className?: string;
  style?: CSSProperties;
};

const toSizeValue = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const toPixelValue = (value: number | string): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) && value.trim().endsWith('px') ? parsedValue : undefined;
};

const transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;

export function TrueAdminLoadingContainer({
  loading = false,
  children,
  tip,
  initialLoadingHeight,
  viewportHeight,
  layout = 'content',
  mode = 'spin',
  fallback,
  keepChildren = false,
  reserveHeight,
  animateHeight = true,
  className,
  style,
}: TrueAdminLoadingContainerProps) {
  const { t } = useI18n();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>();
  const [confirmedHeight, setConfirmedHeight] = useState<number>();
  const loadingTip = tip ?? t('loading.container.tip', '正在加载数据');
  const rootClassName = ['trueadmin-loading-container', darkMode ? 'is-dark' : '', className]
    .filter(Boolean)
    .join(' ');
  const loadingHeight = initialLoadingHeight;
  const loadingHeightValue = loadingHeight === undefined ? undefined : toSizeValue(loadingHeight);
  const loadingHeightPixels = loadingHeight === undefined ? undefined : toPixelValue(loadingHeight);
  const viewportHeightValue =
    viewportHeight === undefined ? undefined : toSizeValue(viewportHeight);
  const isViewportLayout = layout === 'viewport';
  const isLoadingVisible = loading && mode !== 'none';
  const shouldReserveHeight = isViewportLayout ? false : (reserveHeight ?? true);
  const shouldAnimateHeight = !isViewportLayout && animateHeight && shouldReserveHeight;

  useLayoutEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = contentElement.getBoundingClientRect().height;
      if (nextHeight > 0) {
        setMeasuredHeight((currentHeight) =>
          currentHeight === undefined || Math.abs(currentHeight - nextHeight) > 0.5
            ? nextHeight
            : currentHeight,
        );

        if (!isLoadingVisible) {
          setConfirmedHeight((currentHeight) =>
            currentHeight === undefined || Math.abs(currentHeight - nextHeight) > 0.5
              ? nextHeight
              : currentHeight,
          );
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoadingVisible]);

  const reservedHeight = isLoadingVisible
    ? (confirmedHeight ?? measuredHeight ?? loadingHeightPixels)
    : (measuredHeight ?? confirmedHeight ?? loadingHeightPixels);
  const animatedHeight = shouldAnimateHeight ? reservedHeight : undefined;
  const shouldUseLoadingHeight =
    shouldReserveHeight &&
    isLoadingVisible &&
    confirmedHeight === undefined &&
    (animatedHeight === undefined || !shouldAnimateHeight);
  const isHeightReserved = animatedHeight !== undefined || shouldUseLoadingHeight;
  const rootStateClassName = [
    rootClassName,
    isLoadingVisible ? 'is-loading' : '',
    isViewportLayout ? 'is-viewport' : 'is-content-height',
    isHeightReserved ? 'is-reserving-height' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const rootStyle = {
    ...style,
    '--trueadmin-loading-placeholder-height': shouldUseLoadingHeight
      ? loadingHeightValue
      : undefined,
    '--trueadmin-loading-viewport-height': viewportHeightValue,
  } as CSSProperties;
  const stableStyle = isViewportLayout || shouldReserveHeight ? rootStyle : style;
  const loadingNode = fallback ?? (
    <div className="trueadmin-loading-container-spin">
      <Spin />
      {loadingTip ? <Typography.Text type="secondary">{loadingTip}</Typography.Text> : null}
    </div>
  );
  const loadingLayer = (
    <motion.div
      className={`trueadmin-loading-container-layer is-loading-layer is-${mode}`}
      initial={false}
      animate={{ opacity: isLoadingVisible ? 1 : 0 }}
      transition={transition}
      style={{ pointerEvents: isLoadingVisible ? 'auto' : 'none' }}
    >
      {loadingNode}
    </motion.div>
  );
  const contentLayer = (
    <motion.div
      className="trueadmin-loading-container-layer is-content-layer"
      initial={false}
      animate={{ opacity: isLoadingVisible ? 0 : 1 }}
      transition={transition}
    >
      <div ref={contentRef} className="trueadmin-loading-container-measure">
        {children}
      </div>
    </motion.div>
  );

  if (keepChildren) {
    return (
      <motion.div
        className={`${rootStateClassName} is-overlay`}
        style={stableStyle}
        animate={shouldAnimateHeight ? { height: animatedHeight } : undefined}
        transition={transition}
        aria-busy={isLoadingVisible ? 'true' : undefined}
        aria-live="polite"
      >
        <div className="trueadmin-loading-container-content">
          <div ref={contentRef} className="trueadmin-loading-container-measure">
            {children}
          </div>
        </div>
        <motion.div
          className="trueadmin-loading-container-mask"
          initial={false}
          animate={{ opacity: isLoadingVisible ? 1 : 0 }}
          transition={transition}
          style={{ pointerEvents: isLoadingVisible ? 'auto' : 'none' }}
        >
          {loadingLayer}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${rootStateClassName} is-stage`}
      style={stableStyle}
      animate={shouldAnimateHeight ? { height: animatedHeight } : undefined}
      transition={transition}
      aria-busy={isLoadingVisible ? 'true' : undefined}
      aria-live="polite"
    >
      {contentLayer}
      {loadingLayer}
    </motion.div>
  );
}
