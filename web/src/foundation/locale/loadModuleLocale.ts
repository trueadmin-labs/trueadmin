import { addLocale, getLocale } from '@umijs/max';
import type { ModuleLocaleName } from './moduleLocaleRegistry.generated';
import { moduleLocaleLoaders } from './moduleLocaleRegistry.generated';

const loadedModuleLocales = new Set<string>();

export async function loadModuleLocale(moduleName: ModuleLocaleName): Promise<void> {
  const locale = getLocale();
  const cacheKey = `${moduleName}:${locale}`;
  if (loadedModuleLocales.has(cacheKey)) return;

  const localeLoaders = moduleLocaleLoaders[moduleName];
  const loader = localeLoaders?.[locale as keyof typeof localeLoaders];
  if (!loader) return;

  const messages = await loader();
  addLocale(locale, messages.default, undefined as never);
  loadedModuleLocales.add(cacheKey);
}
