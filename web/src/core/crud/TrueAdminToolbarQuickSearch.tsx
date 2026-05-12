import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import type { CrudQuickSearchConfig, CrudTableLocale, CrudToolbarProps } from './types';

type TrueAdminToolbarQuickSearchProps = {
  filterButton: ReactNode;
  locale?: CrudTableLocale;
  quickSearch: CrudQuickSearchConfig;
  quickSearchResetSeed?: number;
  quickSearchValue?: string;
  toolbarProps?: CrudToolbarProps;
  t: (key?: string, fallback?: string) => string;
  onClearQuickSearch: () => void;
  onSubmitQuickSearch: (value: string) => void;
};

export function TrueAdminToolbarQuickSearch({
  filterButton,
  locale,
  quickSearch,
  quickSearchResetSeed = 0,
  quickSearchValue,
  toolbarProps,
  t,
  onClearQuickSearch,
  onSubmitQuickSearch,
}: TrueAdminToolbarQuickSearchProps) {
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

  return (
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
  );
}
