import { CaretDownOutlined, CaretUpOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Space, Tooltip, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export type TrueAdminTreeFilterValue = string | number;

export type TrueAdminTreeFilterItem<TValue extends TrueAdminTreeFilterValue> = {
  label: ReactNode;
  value: TValue;
  count?: number;
  disabled?: boolean;
  selectable?: boolean;
  icon?: ReactNode;
  searchText?: string;
  children?: Array<TrueAdminTreeFilterItem<TValue>>;
};

export type TrueAdminTreeFilterProps<TValue extends TrueAdminTreeFilterValue> = {
  title?: ReactNode;
  value?: TValue;
  items: Array<TrueAdminTreeFilterItem<TValue>>;
  placeholder?: string;
  emptyText?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  defaultExpandAll?: boolean;
  showExpandAction?: boolean;
  expandAllText?: ReactNode;
  collapseAllText?: ReactNode;
  reloadText?: ReactNode;
  extra?: ReactNode;
  onChange?: (value: TValue, item: TrueAdminTreeFilterItem<TValue>) => void;
  onReload?: () => void;
};

const toKey = (value: TrueAdminTreeFilterValue) => String(value);

const toPlainText = (value: ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
};

const normalizeKeyword = (value: string) => value.trim().toLowerCase();

const findItem = <TValue extends TrueAdminTreeFilterValue>(
  items: Array<TrueAdminTreeFilterItem<TValue>>,
  key: string,
): TrueAdminTreeFilterItem<TValue> | undefined => {
  for (const item of items) {
    if (toKey(item.value) === key) {
      return item;
    }

    const matchedChild = item.children ? findItem(item.children, key) : undefined;
    if (matchedChild) {
      return matchedChild;
    }
  }

  return undefined;
};

const getExpandedKeys = <TValue extends TrueAdminTreeFilterValue>(
  items: Array<TrueAdminTreeFilterItem<TValue>>,
): string[] =>
  items.flatMap((item) => [
    toKey(item.value),
    ...(item.children ? getExpandedKeys(item.children) : []),
  ]);

const filterItems = <TValue extends TrueAdminTreeFilterValue>(
  items: Array<TrueAdminTreeFilterItem<TValue>>,
  keyword: string,
): Array<TrueAdminTreeFilterItem<TValue>> => {
  if (!keyword) {
    return items;
  }

  return items.reduce<Array<TrueAdminTreeFilterItem<TValue>>>((result, item) => {
    const searchText = `${item.searchText ?? ''} ${toPlainText(item.label)}`.toLowerCase();
    const filteredChildren = item.children ? filterItems(item.children, keyword) : undefined;

    if (searchText.includes(keyword) || (filteredChildren && filteredChildren.length > 0)) {
      result.push({ ...item, children: filteredChildren });
    }

    return result;
  }, []);
};

const toTreeData = <TValue extends TrueAdminTreeFilterValue>(
  items: Array<TrueAdminTreeFilterItem<TValue>>,
): DataNode[] =>
  items.map((item) => ({
    children: item.children ? toTreeData(item.children) : undefined,
    disabled: item.disabled,
    key: toKey(item.value),
    selectable: item.selectable,
    title: (
      <span className="trueadmin-tree-filter-node">
        {item.icon ? <span className="trueadmin-tree-filter-node-icon">{item.icon}</span> : null}
        <span className="trueadmin-tree-filter-node-label">{item.label}</span>
      </span>
    ),
  }));

export function TrueAdminTreeFilter<TValue extends TrueAdminTreeFilterValue>({
  title,
  value,
  items,
  placeholder,
  emptyText,
  disabled,
  loading,
  defaultExpandAll = true,
  showExpandAction = true,
  expandAllText = '展开全部',
  collapseAllText = '收起全部',
  reloadText = '刷新',
  extra,
  onChange,
  onReload,
}: TrueAdminTreeFilterProps<TValue>) {
  const [keyword, setKeyword] = useState('');
  const normalizedKeyword = normalizeKeyword(keyword);
  const filteredItems = useMemo(
    () => filterItems(items, normalizedKeyword),
    [items, normalizedKeyword],
  );
  const treeData = useMemo(() => toTreeData(filteredItems), [filteredItems]);
  const allExpandedKeys = useMemo(() => getExpandedKeys(filteredItems), [filteredItems]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() =>
    defaultExpandAll ? getExpandedKeys(items) : [],
  );
  const visibleExpandedKeys = normalizedKeyword ? allExpandedKeys : expandedKeys;
  const selectedKeys = value === undefined ? [] : [toKey(value)];
  const visibleExpandedKeySet = new Set(visibleExpandedKeys);
  const isAllExpanded = allExpandedKeys.every((key) => visibleExpandedKeySet.has(key));

  return (
    <div className="trueadmin-tree-filter">
      {title || extra || onReload || showExpandAction ? (
        <div className="trueadmin-tree-filter-header">
          {title ? <Typography.Text strong>{title}</Typography.Text> : <span />}
          <Space className="trueadmin-tree-filter-extra" size={4}>
            {onReload ? (
              <Tooltip title={reloadText}>
                <Button
                  disabled={disabled || loading}
                  icon={<ReloadOutlined />}
                  loading={loading}
                  size="small"
                  type="text"
                  onClick={onReload}
                />
              </Tooltip>
            ) : null}
            {showExpandAction ? (
              <Tooltip title={isAllExpanded ? collapseAllText : expandAllText}>
                <Button
                  disabled={disabled || loading || allExpandedKeys.length === 0}
                  icon={isAllExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
                  size="small"
                  type="text"
                  onClick={() => setExpandedKeys(isAllExpanded ? [] : getExpandedKeys(items))}
                />
              </Tooltip>
            ) : null}
            {extra}
          </Space>
        </div>
      ) : null}
      <Input.Search
        allowClear
        className="trueadmin-tree-filter-search"
        disabled={disabled}
        placeholder={placeholder}
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />

      {treeData.length > 0 ? (
        <Tree
          blockNode
          className="trueadmin-tree-filter-tree"
          disabled={disabled || loading}
          expandedKeys={visibleExpandedKeys}
          selectedKeys={selectedKeys}
          treeData={treeData}
          onExpand={(keys) => setExpandedKeys(keys.map(String))}
          onSelect={(keys) => {
            const nextKey = keys[0];
            if (nextKey === undefined) {
              return;
            }
            const nextItem = findItem(items, String(nextKey));
            if (nextItem) {
              onChange?.(nextItem.value, nextItem);
            }
          }}
        />
      ) : (
        <Empty
          className="trueadmin-tree-filter-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText}
        />
      )}
    </div>
  );
}
