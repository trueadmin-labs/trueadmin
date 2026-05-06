import { layoutConfig } from '@config/index';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type WorkspaceViewportValue = {
  viewportHeight: number;
  footerHeight: number;
  availableHeight: number;
  contentHeight: number;
  tableScrollY: number;
  containerRef: RefObject<HTMLDivElement | null>;
  footerRef: RefObject<HTMLDivElement | null>;
};

const HEADER_HEIGHT = 56;
const TABS_HEIGHT = 40;
const PAGE_VERTICAL_PADDING = 48;
const WorkspaceViewportContext = createContext<WorkspaceViewportValue | null>(null);

type WorkspaceViewportProviderProps = {
  children: ReactNode;
  showFooter?: boolean;
  showTabs?: boolean;
  className?: string;
};

export function WorkspaceViewportProvider({
  children,
  showFooter = true,
  showTabs = false,
  className,
}: WorkspaceViewportProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(640);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const contentElement = containerRef.current;
    if (!contentElement) {
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewportHeight(Math.max(320, contentElement.getBoundingClientRect().height));
        setFooterHeight(showFooter ? (footerRef.current?.getBoundingClientRect().height ?? 0) : 0);
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(contentElement);
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [showFooter]);

  const availableHeight = Math.max(
    320,
    viewportHeight -
      HEADER_HEIGHT -
      (showTabs ? TABS_HEIGHT : 0) -
      footerHeight -
      PAGE_VERTICAL_PADDING,
  );

  const value = useMemo<WorkspaceViewportValue>(
    () => ({
      viewportHeight,
      footerHeight,
      availableHeight,
      contentHeight: availableHeight,
      tableScrollY: Math.max(
        layoutConfig.workspace.minTableHeight,
        availableHeight - layoutConfig.workspace.tableBottomReserve - 230,
      ),
      containerRef,
      footerRef,
    }),
    [availableHeight, footerHeight, viewportHeight],
  );

  return (
    <WorkspaceViewportContext.Provider value={value}>
      <div ref={containerRef} className={className ?? 'trueadmin-workspace-viewport'}>
        {children}
      </div>
    </WorkspaceViewportContext.Provider>
  );
}

export const useWorkspaceViewport = () => {
  const value = useContext(WorkspaceViewportContext);
  if (value === null) {
    throw new Error('useWorkspaceViewport must be used within WorkspaceViewportProvider');
  }

  return value;
};
