import { pluginConfig } from '@config/plugin';
import { registerIcons } from '@/core/icon/TrueAdminIcon';
import { registerModuleNotifications } from '@/core/notification/registry';
import type { ModuleManifest } from './types';

const moduleLoaders = import.meta.glob<{ default: ModuleManifest }>('/src/modules/*/manifest.ts', {
  eager: true,
});

const pluginLoaders = import.meta.glob<{ default: ModuleManifest }>(
  '/src/plugins/*/*/manifest.ts',
  {
    eager: true,
  },
);

export const moduleManifests = Object.values(moduleLoaders).map((module) => module.default);
export const pluginManifests = Object.values(pluginLoaders)
  .map((module) => module.default)
  .filter((manifest) => pluginConfig[manifest.id]?.enabled !== false);
export const enabledManifests = [...moduleManifests, ...pluginManifests];

enabledManifests.forEach(registerModuleNotifications);
enabledManifests.forEach((manifest) => {
  if (manifest.icons) {
    registerIcons(manifest.icons, { source: manifest.id });
  }
});

export const frontendRoutes = enabledManifests.flatMap((manifest) => manifest.routes ?? []);
