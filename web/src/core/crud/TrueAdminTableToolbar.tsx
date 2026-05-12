import { ReloadOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import type { ReactNode } from 'react';
import { TrueAdminToolbarFilterButton } from './TrueAdminToolbarFilterButton';
import { TrueAdminToolbarImportExport } from './TrueAdminToolbarImportExport';
import { TrueAdminToolbarQuickSearch } from './TrueAdminToolbarQuickSearch';
import type {
  CrudImportConfig,
  CrudImportExportConfig,
  CrudQuickSearchConfig,
  CrudTableLocale,
  CrudTableRenderContext,
  CrudToolbarProps,
} from './types';

export type TrueAdminTableToolbarProps = {
  activeFilterCount: number;
  filtersExpanded: boolean;
  hasFilters: boolean;
  loading?: boolean;
  extra?: ReactNode;
  importExport?: false | CrudImportExportConfig<Record<string, unknown>, unknown, unknown, unknown>;
  locale?: CrudTableLocale;
  renderContext: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  selectedCount: number;
  toolbarProps?: CrudToolbarProps;
  t: (key?: string, fallback?: string) => string;
  quickSearch?: CrudQuickSearchConfig;
  quickSearchName?: string;
  quickSearchResetSeed?: number;
  quickSearchValue?: string;
  onOpenImport: (
    config: CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>,
  ) => void;
  onClearQuickSearch: () => void;
  onReload: () => void;
  onSubmitQuickSearch: (value: string) => void;
  onToggleFilters: () => void;
};

export function TrueAdminTableToolbar({
  activeFilterCount,
  filtersExpanded,
  hasFilters,
  loading,
  extra,
  importExport,
  locale,
  renderContext,
  selectedCount,
  toolbarProps,
  t,
  quickSearch,
  quickSearchResetSeed = 0,
  quickSearchValue,
  onOpenImport,
  onClearQuickSearch,
  onReload,
  onSubmitQuickSearch,
  onToggleFilters,
}: TrueAdminTableToolbarProps) {
  const advancedFilterText = locale?.advancedFilterText ?? t('crud.filter.advanced', '高级筛选');
  const reloadText = String(locale?.reloadText ?? t('crud.action.reload', '刷新'));
  const spaceProps = toolbarProps?.spaceProps;

  const filterButton = hasFilters ? (
    <TrueAdminToolbarFilterButton
      activeFilterCount={activeFilterCount}
      advancedFilterText={advancedFilterText}
      filtersExpanded={filtersExpanded}
      toolbarProps={toolbarProps}
      onToggleFilters={onToggleFilters}
    />
  ) : null;

  return (
    <Space
      {...spaceProps}
      className={[
        'trueadmin-crud-table-tools',
        toolbarProps?.classNames?.root,
        toolbarProps?.className,
        spaceProps?.className,
      ]
        .filter(Boolean)
        .join(' ')}
      size={spaceProps?.size ?? 8}
      style={{ ...toolbarProps?.styles?.root, ...toolbarProps?.style, ...spaceProps?.style }}
      wrap={spaceProps?.wrap ?? true}
    >
      {quickSearch ? (
        <TrueAdminToolbarQuickSearch
          filterButton={filterButton}
          locale={locale}
          quickSearch={quickSearch}
          quickSearchResetSeed={quickSearchResetSeed}
          quickSearchValue={quickSearchValue}
          toolbarProps={toolbarProps}
          t={t}
          onClearQuickSearch={onClearQuickSearch}
          onSubmitQuickSearch={onSubmitQuickSearch}
        />
      ) : (
        filterButton
      )}
      {extra}
      <TrueAdminToolbarImportExport
        config={importExport}
        context={renderContext}
        selectedCount={selectedCount}
        locale={locale}
        toolbarProps={toolbarProps}
        t={t}
        onOpenImport={onOpenImport}
      />
      <Button
        {...toolbarProps?.reloadButtonProps}
        aria-label={reloadText}
        className={['trueadmin-crud-icon-button', toolbarProps?.classNames?.reloadButton]
          .filter(Boolean)
          .join(' ')}
        icon={<ReloadOutlined />}
        loading={loading || toolbarProps?.reloadButtonProps?.loading}
        style={{ ...toolbarProps?.styles?.reloadButton, ...toolbarProps?.reloadButtonProps?.style }}
        title={reloadText}
        onClick={onReload}
      />
    </Space>
  );
}
