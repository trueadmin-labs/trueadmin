import type { TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';

export type AppTab = {
  key: string;
  path: string;
  title: string;
  icon?: TrueAdminIconInput;
  pinned: boolean;
  home: boolean;
  refreshKey: number;
  openedAt: number;
  pinnedAt?: number;
};

export type TabDescriptor = {
  key: string;
  path: string;
  title: string;
  icon?: TrueAdminIconInput;
  home?: boolean;
  pinned?: boolean;
};

export type TabCloseScope = 'current' | 'left' | 'right' | 'others' | 'all';

export type PersistedTab = Omit<AppTab, 'icon'>;
