import type { CSSProperties } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useElementSize } from './useElementSize';

const TABLE_HEADER_HEIGHT = 55;
const FILTER_PANEL_TRANSITION_FALLBACK_MS = 280;

const getElementNumberStyle = (element: Element, property: keyof CSSStyleDeclaration) => {
  const value = Number.parseFloat(getComputedStyle(element)[property] as string);
  return Number.isNaN(value) ? 0 : value;
};

export const useCrudTableLayout = ({ dataSourceLength }: { dataSourceLength: number }) => {
  const [isFilterPanelTransitioning, setIsFilterPanelTransitioning] = useState(false);
  const filterPanelTransitionTimerRef = useRef<number | undefined>(undefined);
  const [tableMainRef, tableMainSize, measureTableMainSize] = useElementSize<HTMLDivElement>({
    paused: isFilterPanelTransitioning,
  });
  const [tableEmptyChromeHeight, setTableEmptyChromeHeight] = useState(32);

  const tableBodyScrollY = Math.max(120, tableMainSize.height - TABLE_HEADER_HEIGHT);
  const tableEmptyHeight = Math.max(120, tableBodyScrollY - tableEmptyChromeHeight);
  const tableMainStyle = {
    '--trueadmin-crud-table-empty-height': `${tableEmptyHeight}px`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const tableMainNode = tableMainRef.current;
    if (!tableMainNode) {
      return;
    }

    const bodyNode = tableMainNode.querySelector('.ant-table-body');
    const cellNode = tableMainNode.querySelector('.ant-table-placeholder > .ant-table-cell');
    if (!bodyNode || !cellNode) {
      return;
    }

    const cellVerticalPadding =
      getElementNumberStyle(cellNode, 'paddingTop') +
      getElementNumberStyle(cellNode, 'paddingBottom');
    const cellVerticalBorder =
      getElementNumberStyle(cellNode, 'borderTopWidth') +
      getElementNumberStyle(cellNode, 'borderBottomWidth');
    const horizontalScrollbarHeight =
      bodyNode.clientWidth < bodyNode.scrollWidth
        ? bodyNode.getBoundingClientRect().height - bodyNode.clientHeight
        : 0;
    const nextChromeHeight = Math.max(
      0,
      Math.ceil(cellVerticalPadding + cellVerticalBorder + horizontalScrollbarHeight),
    );

    setTableEmptyChromeHeight((currentChromeHeight) =>
      currentChromeHeight === nextChromeHeight ? currentChromeHeight : nextChromeHeight,
    );
  }, [tableMainRef, tableMainSize.height, tableMainSize.width, dataSourceLength]);

  const finishFilterPanelTransition = useCallback(() => {
    if (filterPanelTransitionTimerRef.current) {
      window.clearTimeout(filterPanelTransitionTimerRef.current);
      filterPanelTransitionTimerRef.current = undefined;
    }

    setIsFilterPanelTransitioning(false);
    measureTableMainSize();
  }, [measureTableMainSize]);

  const beginFilterPanelTransition = useCallback(
    (toggleExpanded: () => void) => {
      if (filterPanelTransitionTimerRef.current) {
        window.clearTimeout(filterPanelTransitionTimerRef.current);
      }

      setIsFilterPanelTransitioning(true);
      toggleExpanded();
      filterPanelTransitionTimerRef.current = window.setTimeout(() => {
        window.requestAnimationFrame(finishFilterPanelTransition);
      }, FILTER_PANEL_TRANSITION_FALLBACK_MS);
    },
    [finishFilterPanelTransition],
  );

  useEffect(
    () => () => {
      if (filterPanelTransitionTimerRef.current) {
        window.clearTimeout(filterPanelTransitionTimerRef.current);
      }
    },
    [],
  );

  return {
    beginFilterPanelTransition,
    finishFilterPanelTransition,
    tableBodyScrollY,
    tableMainRef,
    tableMainStyle,
  };
};
