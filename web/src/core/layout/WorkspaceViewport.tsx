import { layoutConfig } from '@config/index';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type WorkspaceViewportValue = {
  contentHeight: number;
  tableScrollY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const WorkspaceViewportContext = createContext<WorkspaceViewportValue | null>(null);

export function WorkspaceViewportProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(640);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        setContentHeight(Math.max(320, window.innerHeight - rect.top - 24));
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const value = useMemo<WorkspaceViewportValue>(
    () => ({
      contentHeight,
      tableScrollY: Math.max(
        layoutConfig.workspace.minTableHeight,
        contentHeight - layoutConfig.workspace.tableBottomReserve - 230,
      ),
      containerRef,
    }),
    [contentHeight],
  );

  return (
    <WorkspaceViewportContext.Provider value={value}>
      <div ref={containerRef} className="trueadmin-workspace-viewport">
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
