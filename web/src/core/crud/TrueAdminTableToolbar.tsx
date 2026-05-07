import { FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Button, Input, Space, Tooltip } from 'antd';
import { type ChangeEvent, useEffect, useState } from 'react';
import type { CrudQuickSearchConfig } from './types';

export type TrueAdminTableToolbarProps = {
  activeFilterCount: number;
  filtersExpanded: boolean;
  hasFilters: boolean;
  loading?: boolean;
  quickSearch?: CrudQuickSearchConfig;
  quickSearchName?: string;
  quickSearchResetSeed?: number;
  quickSearchValue?: string;
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
  quickSearch,
  quickSearchResetSeed = 0,
  quickSearchValue,
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
      <Button
        aria-label="刷新"
        className="trueadmin-crud-icon-button"
        icon={<ReloadOutlined />}
        loading={loading}
        title="刷新"
        onClick={onReload}
      />
    </Space>
  );
}
