import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { ErrorRegistry } from '@/core/error/types';

export type RouteComponent = LazyExoticComponent<ComponentType> | ComponentType;

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
  };
};

export type LocaleLoader = () => Promise<
  { default: Record<string, string> } | Record<string, string>
>;

export type IconLoader = Record<string, ReactNode>;

export type ModuleManifest = {
  id: string;
  routes?: FrontendRoute[];
  locales?: Record<string, LocaleLoader>;
  icons?: IconLoader;
  errors?: ErrorRegistry;
};

export const defineModule = <T extends ModuleManifest>(manifest: T): T => manifest;
