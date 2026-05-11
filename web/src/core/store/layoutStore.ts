import { themeConfig } from '@config/index';
import { create } from 'zustand';

export type LayoutMode = 'classic' | 'mixed' | 'columns';

export type LayoutPreferences = {
  layoutMode: LayoutMode;
  collapsed: boolean;
  darkMode: boolean;
  showFooter: boolean;
  showTabs: boolean;
  showBreadcrumb: boolean;
  primaryColor: string;
};

type LayoutState = LayoutPreferences & {
  contentFullscreen: boolean;
  setLayoutMode: (layoutMode: LayoutMode) => void;
  setCollapsed: (collapsed: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
  setContentFullscreen: (fullscreen: boolean) => void;
  setShowFooter: (showFooter: boolean) => void;
  setShowTabs: (showTabs: boolean) => void;
  setShowBreadcrumb: (showBreadcrumb: boolean) => void;
  setPrimaryColor: (primaryColor: string) => void;
  applyPreferences: (preferences: Partial<LayoutPreferences>) => void;
};

const validLayoutModes = new Set<LayoutMode>(['classic', 'mixed', 'columns']);
const defaultPrimaryColor = themeConfig.token?.colorPrimary ?? '#1677ff';

const normalizeLayoutMode = (layoutMode: LayoutMode): LayoutMode =>
  validLayoutModes.has(layoutMode) ? layoutMode : 'classic';

export const useLayoutStore = create<LayoutState>()((set) => ({
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
  applyPreferences: (preferences) =>
    set((state) => ({
      layoutMode:
        preferences.layoutMode === undefined
          ? state.layoutMode
          : normalizeLayoutMode(preferences.layoutMode),
      collapsed: preferences.collapsed ?? state.collapsed,
      darkMode: preferences.darkMode ?? state.darkMode,
      showFooter: preferences.showFooter ?? state.showFooter,
      showTabs: preferences.showTabs ?? state.showTabs,
      showBreadcrumb: preferences.showBreadcrumb ?? state.showBreadcrumb,
      primaryColor: preferences.primaryColor ?? state.primaryColor,
    })),
}));
