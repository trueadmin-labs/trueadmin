import type { LayoutMode, LayoutPreferences } from '@/core/store/layoutStore';
import { useLayoutStore } from '@/core/store/layoutStore';

export const SYSTEM_LAYOUT_PREFERENCE_KEY = 'system.layout';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const toLayoutMode = (value: unknown, fallback: LayoutMode): LayoutMode =>
  value === 'classic' || value === 'mixed' || value === 'columns' ? value : fallback;

const toColor = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;

export const pickSystemLayoutPreference = (state: LayoutPreferences): LayoutPreferences => ({
  layoutMode: state.layoutMode,
  collapsed: state.collapsed,
  darkMode: state.darkMode,
  showFooter: state.showFooter,
  showTabs: state.showTabs,
  showBreadcrumb: state.showBreadcrumb,
  primaryColor: state.primaryColor,
});

export const normalizeSystemLayoutPreference = (
  value: unknown,
  fallback: LayoutPreferences,
): LayoutPreferences => {
  const record = toRecord(value);

  return {
    layoutMode: toLayoutMode(record.layoutMode, fallback.layoutMode),
    collapsed: toBoolean(record.collapsed, fallback.collapsed),
    darkMode: toBoolean(record.darkMode, fallback.darkMode),
    showFooter: toBoolean(record.showFooter, fallback.showFooter),
    showTabs: toBoolean(record.showTabs, fallback.showTabs),
    showBreadcrumb: toBoolean(record.showBreadcrumb, fallback.showBreadcrumb),
    primaryColor: toColor(record.primaryColor, fallback.primaryColor),
  };
};

export const getCurrentSystemLayoutPreference = () =>
  pickSystemLayoutPreference(useLayoutStore.getState());

export const applySystemLayoutPreference = (value: unknown) => {
  const store = useLayoutStore.getState();
  store.applyPreferences(normalizeSystemLayoutPreference(value, pickSystemLayoutPreference(store)));
};
