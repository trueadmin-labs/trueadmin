import type { TranslateFunction, TransText } from '@trueadmin/web-core/i18n';
import type { ErrorRegistry } from '@trueadmin/web-react/error';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';
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

export type ProfilePreferenceRenderContext<TValue = Record<string, unknown>> = {
  namespace: string;
  value: TValue;
  preferences: Record<string, unknown>;
  saving: boolean;
  save: (values: TValue) => Promise<void>;
  t: TranslateFunction;
};

export type ProfilePreferenceApplyContext = {
  namespace: string;
  value: unknown;
  preferences: Record<string, unknown>;
};

export type ProfilePreferenceManifest<TValue = Record<string, unknown>> = {
  key: string;
  title: string | TransText;
  description?: string | TransText;
  sort?: number;
  apply?: (context: ProfilePreferenceApplyContext) => void;
  render: (context: ProfilePreferenceRenderContext<TValue>) => ReactNode;
};

export type ModuleProfileManifest = {
  preferences?: ProfilePreferenceManifest[];
};

export type WorkbenchSlot =
  | 'header.main'
  | 'header.actions'
  | 'notice'
  | 'overview.metrics'
  | 'overview.shortcuts'
  | 'main.priority'
  | 'main.focus'
  | 'aside.top'
  | 'aside.middle'
  | 'aside.bottom'
  | 'insights.left'
  | 'insights.right'
  | 'operations'
  | 'activity'
  | 'bottom.full';

export type WorkbenchWidgetSize = 'compact' | 'normal' | 'tall' | 'full';

export type WorkbenchWidgetOverflow = 'hidden' | 'auto' | 'visible';

export type WorkbenchWidgetSpan = 6 | 8 | 12 | 16 | 24;

export type WorkbenchWidgetRenderContext = {
  source: string;
  slot: WorkbenchSlot;
  widget: WorkbenchWidgetManifest;
};

export type WorkbenchWidgetComponent = ComponentType<WorkbenchWidgetRenderContext>;

export type WorkbenchWidgetManifest = {
  key: string;
  slot: WorkbenchSlot;
  title?: string | TransText;
  description?: string | TransText;
  order?: number;
  span?: WorkbenchWidgetSpan;
  size?: WorkbenchWidgetSize;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  overflow?: WorkbenchWidgetOverflow;
  permission?: string;
  component?: WorkbenchWidgetComponent;
};

export type ModuleWorkbenchManifest = {
  widgets?: WorkbenchWidgetManifest[];
};

export type ModuleManifest = {
  id: string;
  routes?: FrontendRoute[];
  locales?: Record<string, LocaleLoader>;
  icons?: IconLoader;
  errors?: ErrorRegistry;
  notification?: ModuleNotificationManifest;
  profile?: ModuleProfileManifest;
  workbench?: ModuleWorkbenchManifest;
};

export const defineModule = <T extends ModuleManifest>(manifest: T): T => manifest;
