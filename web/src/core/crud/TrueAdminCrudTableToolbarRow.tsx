import type { ReactNode } from 'react';
import { joinClassNames } from './crudTableUtils';
import { TrueAdminTableToolbar } from './TrueAdminTableToolbar';
import type {
  CrudImportConfig,
  CrudQuickSearchConfig,
  CrudTableLocale,
  CrudTableRenderContext,
  TrueAdminCrudTableProps,
} from './types';

type TrueAdminCrudTableToolbarRowProps<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = {
  activeFilterCount: number;
  classNames?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['classNames'];
  filtersExpanded: boolean;
  hasFilters: boolean;
  importExport?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['importExport'];
  loading?: boolean;
  locale?: CrudTableLocale;
  quickSearch?: CrudQuickSearchConfig;
  quickSearchResetSeed: number;
  quickSearchValue?: string;
  renderContext: CrudTableRenderContext<TRecord, TMeta, TCreate, TUpdate>;
  selectedCount: number;
  styles?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['styles'];
  toolbarExtra: ReactNode;
  toolbarProps?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['toolbarProps'];
  toolbarTitle: ReactNode;
  t: (key?: string, fallback?: string) => string;
  onClearQuickSearch: () => void;
  onOpenImport: (config: CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>) => void;
  onReload: () => void;
  onSubmitQuickSearch: (value: string) => void;
  onToggleFilters: () => void;
};

export function TrueAdminCrudTableToolbarRow<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
>({
  activeFilterCount,
  classNames,
  filtersExpanded,
  hasFilters,
  importExport,
  loading,
  locale,
  quickSearch,
  quickSearchResetSeed,
  quickSearchValue,
  renderContext,
  selectedCount,
  styles,
  toolbarExtra,
  toolbarProps,
  toolbarTitle,
  t,
  onClearQuickSearch,
  onOpenImport,
  onReload,
  onSubmitQuickSearch,
  onToggleFilters,
}: TrueAdminCrudTableToolbarRowProps<TRecord, TCreate, TUpdate, TMeta>) {
  return (
    <div
      className={joinClassNames('trueadmin-crud-table-toolbar', classNames?.toolbar)}
      style={styles?.toolbar}
    >
      <div
        className={joinClassNames('trueadmin-crud-table-toolbar-left', classNames?.toolbarLeft)}
        style={styles?.toolbarLeft}
      >
        {toolbarTitle}
      </div>
      <div
        className={joinClassNames('trueadmin-crud-table-toolbar-right', classNames?.toolbarRight)}
        style={styles?.toolbarRight}
      >
        <TrueAdminTableToolbar
          activeFilterCount={activeFilterCount}
          filtersExpanded={filtersExpanded}
          hasFilters={hasFilters}
          loading={loading}
          extra={toolbarExtra}
          importExport={importExport as never}
          locale={locale}
          renderContext={renderContext as never}
          selectedCount={selectedCount}
          toolbarProps={toolbarProps as never}
          t={t}
          quickSearch={quickSearch}
          quickSearchResetSeed={quickSearchResetSeed}
          quickSearchValue={quickSearchValue}
          onOpenImport={(config) =>
            onOpenImport(config as CrudImportConfig<TRecord, TMeta, TCreate, TUpdate>)
          }
          onClearQuickSearch={onClearQuickSearch}
          onReload={onReload}
          onSubmitQuickSearch={onSubmitQuickSearch}
          onToggleFilters={onToggleFilters}
        />
      </div>
    </div>
  );
}
