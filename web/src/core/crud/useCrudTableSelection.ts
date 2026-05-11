import type { TableProps } from 'antd';
import type { Key } from 'react';
import { useCallback, useMemo, useState } from 'react';

type RowSelectionOnChange<TRecord extends Record<string, unknown>> = NonNullable<
  NonNullable<TableProps<TRecord>['rowSelection']>['onChange']
>;

type UseCrudTableSelectionOptions<TRecord extends Record<string, unknown>> = {
  rowKey?: keyof TRecord | ((record: TRecord) => Key);
  rowSelection?: TableProps<TRecord>['rowSelection'];
};

export function useCrudTableSelection<TRecord extends Record<string, unknown>>({
  rowKey,
  rowSelection,
}: UseCrudTableSelectionOptions<TRecord>) {
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>([]);
  const [innerSelectedRows, setInnerSelectedRows] = useState<TRecord[]>([]);
  const selectedRowKeys = rowSelection?.selectedRowKeys ?? innerSelectedRowKeys;
  const selectedRowKeySet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const getRecordKey = useCallback(
    (record: TRecord) => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[(rowKey ?? 'id') as keyof TRecord] as Key;
    },
    [rowKey],
  );
  const selectedRows = rowSelection
    ? innerSelectedRows.filter((record) => selectedRowKeySet.has(getRecordKey(record)))
    : [];
  const selectedCount = rowSelection ? selectedRowKeys.length : 0;

  const clearSelected = useCallback(() => {
    setInnerSelectedRowKeys([]);
    setInnerSelectedRows([]);
    rowSelection?.onChange?.([], [], { type: 'none' } as Parameters<
      RowSelectionOnChange<TRecord>
    >[2]);
  }, [rowSelection]);

  const mergedRowSelection = rowSelection
    ? {
        ...rowSelection,
        selectedRowKeys,
        onChange: (
          keys: Key[],
          rows: TRecord[],
          info: Parameters<RowSelectionOnChange<TRecord>>[2],
        ) => {
          setInnerSelectedRowKeys(keys);
          setInnerSelectedRows(rows);
          rowSelection.onChange?.(keys, rows, info);
        },
      }
    : undefined;

  return {
    clearSelected,
    getRecordKey,
    mergedRowSelection,
    selectedCount,
    selectedRowKeys,
    selectedRows,
  };
}
