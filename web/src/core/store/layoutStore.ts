import { themeConfig } from '@config/index';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutMode = 'classic' | 'mixed' | 'columns';

type LayoutState = {
  layoutMode: LayoutMode;
  collapsed: boolean;
  darkMode: boolean;
  contentFullscreen: boolean;
  showFooter: boolean;
  showTabs: boolean;
  showBreadcrumb: boolean;
  primaryColor: string;
  setLayoutMode: (layoutMode: LayoutMode) => void;
  setCollapsed: (collapsed: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
  setContentFullscreen: (fullscreen: boolean) => void;
  setShowFooter: (showFooter: boolean) => void;
  setShowTabs: (showTabs: boolean) => void;
  setShowBreadcrumb: (showBreadcrumb: boolean) => void;
  setPrimaryColor: (primaryColor: string) => void;
};

const validLayoutModes = new Set<LayoutMode>(['classic', 'mixed', 'columns']);
const defaultPrimaryColor = themeConfig.token?.colorPrimary ?? '#1677ff';

const normalizeLayoutMode = (layoutMode: LayoutMode): LayoutMode =>
  validLayoutModes.has(layoutMode) ? layoutMode : 'classic';

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutMode: 'classic',
      collapsed: false,
      darkMode: false,
      contentFullscreen: false,
      showFooter: true,
      showTabs: false,
      showBreadcrumb: true,
      primaryColor: defaultPrimaryColor,
      setLayoutMode: (layoutMode) => set({ layoutMode: normalizeLayoutMode(layoutMode) }),
      setCollapsed: (collapsed) => set({ collapsed }),
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setContentFullscreen: (contentFullscreen) => set({ contentFullscreen }),
      setShowFooter: (showFooter) => set({ showFooter }),
      setShowTabs: (showTabs) => set({ showTabs }),
      setShowBreadcrumb: (showBreadcrumb) => set({ showBreadcrumb }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
    }),
    {
      name: 'trueadmin.layout',
      partialize: (state) => ({
        layoutMode: state.layoutMode,
        collapsed: state.collapsed,
        darkMode: state.darkMode,
        showFooter: state.showFooter,
        showTabs: state.showTabs,
        showBreadcrumb: state.showBreadcrumb,
        primaryColor: state.primaryColor,
      }),
    },
  ),
);
