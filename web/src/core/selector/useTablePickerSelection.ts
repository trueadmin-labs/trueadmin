import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrueAdminCrudTableProps } from '@/core/crud/types';
import type { TrueAdminTablePickerProps } from './TrueAdminTablePicker';
import { toKeyString } from './tablePickerUtils';

type UseTablePickerSelectionOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = {
  controlledSelectedRows: TRecord[];
  defaultValue: Key[];
  isValueControlled: boolean;
  multiple: boolean;
  onChange?: TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>['onChange'];
  onConfirm?: TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>['onConfirm'];
  open: boolean;
  rowKey: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['rowKey'];
  rowSelection?: TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>['rowSelection'];
  value?: Key[];
};

export function useTablePickerSelection<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  controlledSelectedRows,
  defaultValue,
  isValueControlled,
  multiple,
  onChange,
  onConfirm,
  open,
  rowKey,
  rowSelection,
  value,
}: UseTablePickerSelectionOptions<TRecord, TCreate, TUpdate, TMeta>) {
  const wasOpenRef = useRef(false);
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>(defaultValue);
  const [selectedRowMap, setSelectedRowMap] = useState<Map<string, TRecord>>(() => new Map());
  const [draftSelectedRowKeys, setDraftSelectedRowKeys] = useState<Key[]>(defaultValue);
  const [draftRowMap, setDraftRowMap] = useState<Map<string, TRecord>>(() => new Map());
  const selectedRowKeys = isValueControlled ? (value ?? []) : innerSelectedRowKeys;
  const getRecordKey = useCallback(
    (record: TRecord) =>
      typeof rowKey === 'function'
        ? rowKey(record)
        : (record[(rowKey ?? 'id') as keyof TRecord] as Key),
    [rowKey],
  );

  useEffect(() => {
    if (controlledSelectedRows.length === 0) {
      return;
    }
    setSelectedRowMap((currentMap) => {
      const nextMap = new Map(currentMap);
      let changed = false;
      controlledSelectedRows.forEach((record) => {
        const key = getRecordKey(record);
        const keyString = toKeyString(key);
        if (nextMap.get(keyString) !== record) {
          nextMap.set(keyString, record);
          changed = true;
        }
      });
      return changed ? nextMap : currentMap;
    });
  }, [controlledSelectedRows, getRecordKey]);

  const committedRowMap = useMemo(() => {
    if (controlledSelectedRows.length === 0) {
      return selectedRowMap;
    }
    const nextMap = new Map(selectedRowMap);
    controlledSelectedRows.forEach((record) => {
      nextMap.set(toKeyString(getRecordKey(record)), record);
    });
    return nextMap;
  }, [controlledSelectedRows, getRecordKey, selectedRowMap]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraftSelectedRowKeys(selectedRowKeys);
      setDraftRowMap(committedRowMap);
    }
    wasOpenRef.current = open;
  }, [committedRowMap, open, selectedRowKeys]);

  const draftSelectedRows = useMemo(
    () =>
      draftSelectedRowKeys
        .map((key) => draftRowMap.get(toKeyString(key)))
        .filter((record): record is TRecord => Boolean(record)),
    [draftSelectedRowKeys, draftRowMap],
  );

  const mergedRowSelection = useMemo(
    () => ({
      preserveSelectedRowKeys: true,
      type: multiple ? ('checkbox' as const) : ('radio' as const),
      ...rowSelection,
      selectedRowKeys: draftSelectedRowKeys,
      onChange: (keys: Key[], rows: TRecord[]) => {
        const currentRows = new Map<string, TRecord>();
        rows.forEach((record, index) => {
          const key = keys[index];
          if (key !== undefined) {
            currentRows.set(toKeyString(key), record);
          }
        });
        const nextMap = new Map(draftRowMap);
        keys.forEach((key) => {
          const record = currentRows.get(toKeyString(key));
          if (record) {
            nextMap.set(toKeyString(key), record);
          }
        });
        for (const key of nextMap.keys()) {
          if (!keys.some((item) => toKeyString(item) === key)) {
            nextMap.delete(key);
          }
        }
        const nextRows = keys
          .map((key) => nextMap.get(toKeyString(key)))
          .filter((record): record is TRecord => Boolean(record));

        setDraftRowMap(nextMap);
        setDraftSelectedRowKeys(keys);
        rowSelection?.onChange?.(keys, nextRows);
      },
    }),
    [draftRowMap, draftSelectedRowKeys, multiple, rowSelection],
  );

  const confirmSelection = useCallback(() => {
    setSelectedRowMap(draftRowMap);
    if (!isValueControlled) {
      setInnerSelectedRowKeys(draftSelectedRowKeys);
    }
    onChange?.(draftSelectedRowKeys, draftSelectedRows);
    onConfirm?.(draftSelectedRowKeys, draftSelectedRows);
  }, [
    draftRowMap,
    draftSelectedRowKeys,
    draftSelectedRows,
    isValueControlled,
    onChange,
    onConfirm,
  ]);

  return {
    confirmSelection,
    mergedRowSelection,
  };
}
