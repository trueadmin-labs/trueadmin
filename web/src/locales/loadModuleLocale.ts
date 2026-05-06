import { addLocale, getLocale } from '@umijs/max';

export type ModuleLocaleName = string;
type ModuleLocaleMessages = { default: Record<string, string> };
type ModuleLocaleLoader = () => Promise<ModuleLocaleMessages>;

const moduleLocaleLoaders = import.meta.glob<ModuleLocaleMessages>(
  '../modules/*/locales/*.ts',
);
const loadedModuleLocales = new Set<string>();

function getModuleLocaleLoader(
  moduleName: ModuleLocaleName,
  locale: string,
): ModuleLocaleLoader | undefined {
  return moduleLocaleLoaders[
    `../modules/${moduleName}/locales/${locale}.ts`
  ] as ModuleLocaleLoader | undefined;
}

export async function loadModuleLocale(
  moduleName: ModuleLocaleName,
): Promise<void> {
  const locale = getLocale();
  const cacheKey = `${moduleName}:${locale}`;
  if (loadedModuleLocales.has(cacheKey)) return;

  const loader = getModuleLocaleLoader(moduleName, locale);
  if (!loader) return;

  const messages = await loader();
  addLocale(locale, messages.default, undefined as never);
  loadedModuleLocales.add(cacheKey);
}
