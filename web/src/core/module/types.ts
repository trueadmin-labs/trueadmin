import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { ErrorRegistry } from '@/core/error/types';
import type { BackendMenu } from '@/core/menu/types';

export type RouteComponent = LazyExoticComponent<ComponentType> | ComponentType;

export type RouteLayoutMeta = {
  showFooter?: boolean;
  showTabs?: boolean;
  showBreadcrumb?: boolean;
  contentPadding?: boolean;
  fullscreen?: boolean;
};

export type FrontendRoute = {
  path: string;
  component: RouteComponent;
  meta?: {
    title?: string;
    pageType?:
      | 'crud-page'
      | 'form-page'
      | 'detail-page'
      | 'dashboard-page'
      | 'split-page'
      | 'custom-page';
    icon?: string;
    auth?: boolean;
    layout?: RouteLayoutMeta;
  };
};

export type FrontendMenu = Omit<BackendMenu, 'children'> & {
  parentPath?: string;
  devOnly?: boolean;
  children?: FrontendMenu[];
};

export type LocaleLoader = () => Promise<
  { default: Record<string, string> } | Record<string, string>
>;

export type IconLoader = Record<string, ReactNode>;

export type ModuleManifest = {
  id: string;
  routes?: FrontendRoute[];
  menus?: FrontendMenu[];
  locales?: Record<string, LocaleLoader>;
  icons?: IconLoader;
  errors?: ErrorRegistry;
};

export const defineModule = <T extends ModuleManifest>(manifest: T): T => manifest;
