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
  CrudTableRenderContext,
} from './types';

type ImportExportToolbarProps = {
  context: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  config?: false | CrudImportExportConfig<Record<string, unknown>, unknown, unknown, unknown>;
  selectedCount: number;
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
  renderContext: CrudTableRenderContext<Record<string, unknown>, unknown, unknown, unknown>;
  selectedCount: number;
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
  selectedCount,
  t,
  onOpenImport,
}: ImportExportToolbarProps) {
  if (!config) {
    return null;
  }

  const importConfig = config.import === true ? {} : config.import;
  const exportConfig = config.export === true ? {} : config.export;
  const exportOptions = exportConfig ? (exportConfig.options ?? DEFAULT_EXPORT_OPTIONS) : [];

  return (
    <Space size={8} wrap={false}>
      {importConfig ? (
        <Tooltip title={t('crud.action.import', '导入')}>
          <Button
            aria-label={t('crud.action.import', '导入')}
            className="trueadmin-crud-icon-button"
            disabled={importConfig.disabled}
            icon={<UploadOutlined />}
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
          <Tooltip title={t('crud.action.export', '导出')}>
            <Button
              aria-label={t('crud.action.export', '导出')}
              className="trueadmin-crud-icon-button"
              icon={<DownloadOutlined />}
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
  renderContext,
  selectedCount,
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

  const filterButton = hasFilters ? (
    <Tooltip title="高级筛选">
      <span className="trueadmin-crud-search-addon">
        <Badge count={activeFilterCount} offset={[-2, 2]} size="small">
          <Button
            aria-label="高级筛选"
            className={[
              'trueadmin-crud-icon-button',
              'trueadmin-crud-filter-button',
              filtersExpanded ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            icon={<FilterOutlined />}
            onClick={onToggleFilters}
          />
        </Badge>
      </span>
    </Tooltip>
  ) : null;

  return (
    <Space className="trueadmin-crud-table-tools" size={8} wrap>
      {quickSearch ? (
        <div className="trueadmin-crud-search-group">
          <Input
            allowClear
            className="trueadmin-crud-quick-search"
            value={inputValue}
            placeholder={quickSearch.placeholder ?? '请输入关键词'}
            onChange={handleChange}
            onPressEnter={() => onSubmitQuickSearch(inputValue)}
          />
          <Tooltip title="搜索">
            <span className="trueadmin-crud-search-addon">
              <Button
                aria-label="搜索"
                className="trueadmin-crud-icon-button trueadmin-crud-search-button"
                icon={<SearchOutlined />}
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
        t={t}
        onOpenImport={onOpenImport}
      />
      <Button
        aria-label={t('crud.action.reload', '刷新')}
        className="trueadmin-crud-icon-button"
        icon={<ReloadOutlined />}
        loading={loading}
        title={t('crud.action.reload', '刷新')}
        onClick={onReload}
      />
    </Space>
  );
}
