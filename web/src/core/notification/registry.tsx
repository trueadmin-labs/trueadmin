import type { ReactNode } from 'react';
import { isTransText, resolveTrans, type TranslateFunction, trans } from '@/core/i18n/trans';
import type { ModuleManifest } from '@/core/module/types';
import type { AdminMessageLabel, AdminMessageSourceConfig, AdminMessageTypeConfig } from './types';

const registry = new Map<string, AdminMessageTypeConfig>();
const sourceRegistry = new Map<string, AdminMessageSourceConfig>();

export const defaultAdminMessageTypeConfig: AdminMessageTypeConfig = {
  color: 'default',
  icon: 'InfoCircleOutlined',
};

export const registerAdminMessageType = (type: string, config: AdminMessageTypeConfig) => {
  registry.set(type, config);

  return () => {
    registry.delete(type);
  };
};

export const getAdminMessageTypeConfig = (type: string): AdminMessageTypeConfig => ({
  ...defaultAdminMessageTypeConfig,
  ...registry.get(type),
});

export const getRegisteredAdminMessageTypes = () => [...registry.keys()];

export const registerAdminMessageSource = (source: string, config: AdminMessageSourceConfig) => {
  sourceRegistry.set(source, config);

  return () => {
    sourceRegistry.delete(source);
  };
};

export const getAdminMessageSourceConfig = (source: string): AdminMessageSourceConfig | undefined =>
  sourceRegistry.get(source);

export const getRegisteredAdminMessageSources = () => [...sourceRegistry.keys()];

export const resolveAdminMessageLabel = (
  label: AdminMessageLabel | undefined,
  translate: TranslateFunction,
  fallback: string,
): ReactNode => {
  if (isTransText(label)) {
    return resolveTrans(label, translate, fallback);
  }

  return label ?? fallback;
};

export const registerModuleNotifications = (manifest: ModuleManifest) => {
  Object.entries(manifest.notification?.types ?? {}).forEach(([type, config]) => {
    registerAdminMessageType(type, config);
  });
  Object.entries(manifest.notification?.sources ?? {}).forEach(([source, config]) => {
    registerAdminMessageSource(source, config);
  });
};

registerAdminMessageType('system', {
  label: trans('notification.type.system', '系统'),
  color: 'blue',
  icon: 'InfoCircleOutlined',
});

registerAdminMessageType('announcement', {
  label: trans('notification.type.announcement', '公告'),
  color: 'purple',
  icon: 'BellOutlined',
});

registerAdminMessageType('alert', {
  label: trans('notification.type.alert', '预警'),
  color: 'red',
  icon: 'ExclamationCircleOutlined',
});
