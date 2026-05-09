import type { ComponentType, LazyExoticComponent } from 'react';
import type { ErrorRegistry } from '@/core/error/types';
import type { TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';
import type { AppMenu } from '@/core/menu/types';
import type { AdminMessageSourceConfig, AdminMessageTypeConfig } from '@/core/notification/types';

export type RouteComponent = LazyExoticComponent<ComponentType> | ComponentType;

export type RouteLayoutMeta = {
  showFooter?: boolean;
  showTabs?: boolean;
  showBreadcrumb?: boolean;
  contentPadding?: boolean;
  fullscreen?: boolean;
};

export type RouteTabMeta = {
  enabled?: boolean;
  title?: string;
  closable?: boolean;
  icon?: TrueAdminIconInput;
  keyMode?: 'pathname' | 'fullPath';
  key?: string;
};

export type FrontendRoute = {
  path: string;
  component: RouteComponent;
  meta?: {
    title?: string;
    icon?: TrueAdminIconInput;
    auth?: boolean;
    layout?: RouteLayoutMeta;
    tab?: RouteTabMeta;
  };
};

export type FrontendMenu = Omit<AppMenu, 'children'> & {
  parentPath?: string;
  devOnly?: boolean;
  children?: FrontendMenu[];
};

export type LocaleLoader = () => Promise<
  { default: Record<string, string> } | Record<string, string>
>;

export type IconLoader = Record<string, TrueAdminIconInput>;

export type ModuleNotificationSourceConfig = AdminMessageSourceConfig;

export type ModuleNotificationTypeConfig = Omit<AdminMessageTypeConfig, 'onClick'>;

export type ModuleNotificationManifest = {
  sources?: Record<string, ModuleNotificationSourceConfig>;
  types?: Record<string, ModuleNotificationTypeConfig>;
};

export type ModuleManifest = {
  id: string;
  routes?: FrontendRoute[];
  menus?: FrontendMenu[];
  locales?: Record<string, LocaleLoader>;
  icons?: IconLoader;
  errors?: ErrorRegistry;
  notification?: ModuleNotificationManifest;
};

export const defineModule = <T extends ModuleManifest>(manifest: T): T => manifest;
