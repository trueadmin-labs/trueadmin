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
export const pluginManifests = Object.values(pluginLoaders).map((module) => module.default);
export const enabledManifests = [...moduleManifests, ...pluginManifests];

export const frontendRoutes = enabledManifests.flatMap((manifest) => manifest.routes ?? []);
