import { useEffect } from 'react';
import { loadModuleLocale } from './loadModuleLocale';
import type { ModuleLocaleName } from './moduleLocaleRegistry.generated';

export function useModuleLocale(moduleName: ModuleLocaleName): void {
  useEffect(() => {
    void loadModuleLocale(moduleName);
  }, [moduleName]);
}
