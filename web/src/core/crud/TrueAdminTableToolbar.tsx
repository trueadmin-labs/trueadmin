import {
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Badge, Button, Dropdown, Input, Space, Tooltip } from 'antd';
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import type {
  CrudExportType,
  CrudImportConfig,
  CrudImportExportConfig,
  CrudQuickSearchConfig,
  CrudTableLocale,
  CrudTableRenderContext,
  CrudToolbarProps,
} from './types';

type ImportExportToolbarProps = {
  context: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  config?: false | CrudImportExportConfig<Record<string, unknown>, unknown, unknown, unknown>;
  locale?: CrudTableLocale;
  selectedCount: number;
  toolbarProps?: CrudToolbarProps;
  t: (key?: string, fallback?: string) => string;
  onOpenImport: (
    config: CrudImportConfig<Record<string, unknown>, unknown, unknown, unknown>,
  ) => void;
};

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

const DEFAULT_EXPORT_OPTIONS: CrudExportType[] = ['page', 'selected', 'all'];

function ImportExportToolbar({
  config,
  context,
  locale,
  selectedCount,
  toolbarProps,
  t,
  onOpenImport,
}: ImportExportToolbarProps) {
  if (!config) {
    return null;
  }

  const importConfig = config.import === true ? {} : config.import;
  const exportConfig = config.export === true ? {} : config.export;
  const exportOptions = exportConfig ? (exportConfig.options ?? DEFAULT_EXPORT_OPTIONS) : [];
  const importText = locale?.importText ?? t('crud.action.import', '导入');
  const exportText = locale?.exportText ?? t('crud.action.export', '导出');

  return (
    <Space
      className={toolbarProps?.classNames?.importExport}
      size={8}
      style={toolbarProps?.styles?.importExport}
      wrap={false}
    >
      {importConfig ? (
        <Tooltip title={importText}>
          <Button
            {...toolbarProps?.importButtonProps}
            aria-label={importText}
            className={['trueadmin-crud-icon-button', toolbarProps?.classNames?.importButton]
              .filter(Boolean)
              .join(' ')}
            disabled={importConfig.disabled || toolbarProps?.importButtonProps?.disabled}
            icon={<UploadOutlined />}
            style={{
              ...toolbarProps?.styles?.importButton,
              ...toolbarProps?.importButtonProps?.style,
            }}
            onClick={() => onOpenImport(config.import ?? true)}
          />
        </Tooltip>
      ) : null}
      {exportConfig ? (
        <Dropdown
          disabled={exportConfig.disabled}
          menu={{
            items: exportOptions.map((type) => ({
              disabled: type === 'selected' && selectedCount === 0,
              key: type,
              label:
                type === 'page'
                  ? t('crud.export.currentPage', '导出当页')
                  : type === 'selected'
                    ? t('crud.export.selected', '导出选中')
                    : t('crud.export.filteredAll', '导出全部结果'),
            })),
            onClick: ({ key }) => exportConfig.onExport?.(key as CrudExportType, context),
          }}
        >
          <Tooltip title={exportText}>
            <Button
              {...toolbarProps?.exportButtonProps}
              aria-label={exportText}
              className={['trueadmin-crud-icon-button', toolbarProps?.classNames?.exportButton]
                .filter(Boolean)
                .join(' ')}
              icon={<DownloadOutlined />}
              style={{
                ...toolbarProps?.styles?.exportButton,
                ...toolbarProps?.exportButtonProps?.style,
              }}
            />
          </Tooltip>
        </Dropdown>
      ) : null}
    </Space>
  );
}

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
  const [inputValue, setInputValue] = useState(quickSearchValue ?? '');

  useEffect(() => {
    setInputValue(quickSearchValue ?? '');
  }, [quickSearchValue]);

  useEffect(() => {
    if (quickSearchResetSeed > 0) {
      setInputValue('');
    }
  }, [quickSearchResetSeed]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    if (nextValue.length === 0 && quickSearchValue) {
      onClearQuickSearch();
    }
  };

  const searchText = locale?.searchText ?? t('crud.action.search', '搜索');
  const advancedFilterText = locale?.advancedFilterText ?? t('crud.filter.advanced', '高级筛选');
  const reloadText = String(locale?.reloadText ?? t('crud.action.reload', '刷新'));
  const spaceProps = toolbarProps?.spaceProps;

  const filterButton = hasFilters ? (
    <Tooltip title={advancedFilterText}>
      <span
        className={['trueadmin-crud-search-addon', toolbarProps?.classNames?.searchAddon]
          .filter(Boolean)
          .join(' ')}
        style={toolbarProps?.styles?.searchAddon}
      >
        <Badge count={activeFilterCount} offset={[-2, 2]} size="small">
          <Button
            {...toolbarProps?.filterButtonProps}
            aria-label={advancedFilterText}
            className={[
              'trueadmin-crud-icon-button',
              'trueadmin-crud-filter-button',
              filtersExpanded ? 'is-active' : '',
              toolbarProps?.classNames?.filterButton,
            ]
              .filter(Boolean)
              .join(' ')}
            icon={<FilterOutlined />}
            style={{
              ...toolbarProps?.styles?.filterButton,
              ...toolbarProps?.filterButtonProps?.style,
            }}
            onClick={onToggleFilters}
          />
        </Badge>
      </span>
    </Tooltip>
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
        <div
          className={['trueadmin-crud-search-group', toolbarProps?.classNames?.quickSearchGroup]
            .filter(Boolean)
            .join(' ')}
          style={toolbarProps?.styles?.quickSearchGroup}
        >
          <Input
            {...toolbarProps?.quickSearchInputProps}
            allowClear={toolbarProps?.quickSearchInputProps?.allowClear ?? true}
            className={['trueadmin-crud-quick-search', toolbarProps?.classNames?.quickSearch]
              .filter(Boolean)
              .join(' ')}
            value={inputValue}
            placeholder={
              toolbarProps?.quickSearchInputProps?.placeholder ??
              quickSearch.placeholder ??
              locale?.quickSearchPlaceholder ??
              t('crud.quickSearch.placeholder', '请输入关键词')
            }
            style={{
              ...toolbarProps?.styles?.quickSearch,
              ...toolbarProps?.quickSearchInputProps?.style,
            }}
            onChange={handleChange}
            onPressEnter={() => onSubmitQuickSearch(inputValue)}
          />
          <Tooltip title={searchText}>
            <span
              className={['trueadmin-crud-search-addon', toolbarProps?.classNames?.searchAddon]
                .filter(Boolean)
                .join(' ')}
              style={toolbarProps?.styles?.searchAddon}
            >
              <Button
                {...toolbarProps?.searchButtonProps}
                aria-label={searchText}
                className={[
                  'trueadmin-crud-icon-button',
                  'trueadmin-crud-search-button',
                  toolbarProps?.classNames?.searchButton,
                ]
                  .filter(Boolean)
                  .join(' ')}
                icon={<SearchOutlined />}
                style={{
                  ...toolbarProps?.styles?.searchButton,
                  ...toolbarProps?.searchButtonProps?.style,
                }}
                onClick={() => onSubmitQuickSearch(inputValue)}
              />
            </span>
          </Tooltip>
          {filterButton}
        </div>
      ) : (
        filterButton
      )}
      {extra}
      <ImportExportToolbar
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
