import type { Key, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrueAdminCrudTable } from '@/core/crud/TrueAdminCrudTable';
import type { TrueAdminCrudTableProps } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPageModal, type TrueAdminPageModalProps } from '@/core/modal/TrueAdminPageModal';

export type TrueAdminTablePickerClassNames = {
  root?: string;
  body?: string;
  aside?: string;
  main?: string;
};

export type TrueAdminTablePickerStyles = {
  root?: React.CSSProperties;
  body?: React.CSSProperties;
  aside?: React.CSSProperties;
  main?: React.CSSProperties;
};

export type TrueAdminTablePickerProps<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
> = Omit<TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>, 'rowSelection'> & {
  open: boolean;
  title?: ReactNode;
  value?: Key[];
  defaultValue?: Key[];
  selectedRows?: TRecord[];
  multiple?: boolean;
  aside?: ReactNode;
  asideWidth?: number | string;
  asideGap?: number | string;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  modalProps?: Omit<TrueAdminPageModalProps, 'children' | 'open' | 'title' | 'onCancel' | 'onOk'>;
  classNames?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['classNames'] &
    TrueAdminTablePickerClassNames;
  styles?: TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>['styles'] &
    TrueAdminTablePickerStyles;
  rowSelection?: Omit<NonNullable<TrueAdminCrudTableProps<TRecord>['rowSelection']>, 'onChange'> & {
    onChange?: (keys: Key[], rows: TRecord[]) => void;
  };
  onChange?: (keys: Key[], rows: TRecord[]) => void;
  onConfirm?: (keys: Key[], rows: TRecord[]) => void;
  onCancel?: () => void;
};

const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(Boolean).join(' ');

const toKeyString = (key: Key) => String(key);

export function TrueAdminTablePicker<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>(props: TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>) {
  const {
    aside,
    asideGap = 0,
    asideWidth = 280,
    cancelText,
    className,
    classNames,
    confirmText,
    defaultValue = [],
    modalProps,
    multiple = false,
    onCancel,
    onChange,
    onConfirm,
    open,
    rowSelection,
    selectedRows: controlledSelectedRows = [],
    styles,
    style,
    title,
    value,
    ...crudTableProps
  } = props;
  const isValueControlled = Object.hasOwn(props, 'value');
  const { t } = useI18n();
  const wasOpenRef = useRef(false);
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>(defaultValue);
  const [selectedRowMap, setSelectedRowMap] = useState<Map<string, TRecord>>(() => new Map());
  const [draftSelectedRowKeys, setDraftSelectedRowKeys] = useState<Key[]>(defaultValue);
  const [draftRowMap, setDraftRowMap] = useState<Map<string, TRecord>>(() => new Map());
  const selectedRowKeys = isValueControlled ? (value ?? []) : innerSelectedRowKeys;
  const hasAside = Boolean(aside);
  const getRecordKey = useCallback(
    (record: TRecord) =>
      typeof crudTableProps.rowKey === 'function'
        ? crudTableProps.rowKey(record)
        : (record[(crudTableProps.rowKey ?? 'id') as keyof TRecord] as Key),
    [crudTableProps.rowKey],
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

  const rootStyle = {
    '--trueadmin-table-picker-aside-width': toSizeValue(asideWidth),
    '--trueadmin-table-picker-aside-gap': toSizeValue(asideGap),
    ...styles?.root,
    ...style,
  } as React.CSSProperties;

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

  const confirmSelection = () => {
    setSelectedRowMap(draftRowMap);
    if (!isValueControlled) {
      setInnerSelectedRowKeys(draftSelectedRowKeys);
    }
    onChange?.(draftSelectedRowKeys, draftSelectedRows);
    onConfirm?.(draftSelectedRowKeys, draftSelectedRows);
  };

  const tableDom = (
    <TrueAdminCrudTable<TRecord, TCreate, TUpdate, TMeta>
      {...crudTableProps}
      className="trueadmin-table-picker-table"
      classNames={classNames}
      importExport={false}
      rowActions={false}
      rowSelection={mergedRowSelection}
      styles={styles}
      tableAlertRender={false}
    />
  );

  return (
    <TrueAdminPageModal
      width="min(1180px, calc(100vw - 48px))"
      {...modalProps}
      className={joinClassNames('trueadmin-table-picker-modal', modalProps?.className)}
      okText={confirmText ?? t('selector.table.confirm', '确认选择')}
      open={open}
      title={title ?? t('selector.table.title', '选择数据')}
      cancelText={cancelText ?? t('selector.table.cancel', '取消')}
      onCancel={onCancel}
      onOk={confirmSelection}
    >
      <div
        className={joinClassNames(
          'trueadmin-table-picker',
          hasAside ? 'has-aside' : '',
          className,
          classNames?.root,
        )}
        style={rootStyle}
      >
        <div className={joinClassNames('trueadmin-table-picker-body', classNames?.body)}>
          {hasAside ? (
            <aside
              className={joinClassNames('trueadmin-table-picker-aside', classNames?.aside)}
              style={{ ...styles?.aside }}
            >
              {aside}
            </aside>
          ) : null}
          <main
            className={joinClassNames('trueadmin-table-picker-main', classNames?.main)}
            style={{ ...styles?.main }}
          >
            {tableDom}
          </main>
        </div>
      </div>
    </TrueAdminPageModal>
  );
}
