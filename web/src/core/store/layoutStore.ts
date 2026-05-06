import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LayoutState = {
  collapsed: boolean;
  darkMode: boolean;
  contentFullscreen: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleDarkMode: () => void;
  setContentFullscreen: (fullscreen: boolean) => void;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      collapsed: false,
      darkMode: false,
      contentFullscreen: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setContentFullscreen: (contentFullscreen) => set({ contentFullscreen }),
    }),
    { name: 'trueadmin.layout' },
  ),
);
