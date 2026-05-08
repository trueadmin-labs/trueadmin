import type { Key, ReactNode } from 'react';
import { useMemo, useState } from 'react';
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
>({
  aside,
  asideGap = 10,
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
  styles,
  style,
  title,
  value,
  ...crudTableProps
}: TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>) {
  const { t } = useI18n();
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>(defaultValue);
  const [selectedRowMap, setSelectedRowMap] = useState<Map<string, TRecord>>(() => new Map());
  const selectedRowKeys = value ?? innerSelectedRowKeys;
  const selectedRows = useMemo(
    () =>
      selectedRowKeys
        .map((key) => selectedRowMap.get(toKeyString(key)))
        .filter((record): record is TRecord => Boolean(record)),
    [selectedRowKeys, selectedRowMap],
  );
  const hasAside = Boolean(aside);

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
      selectedRowKeys,
      onChange: (keys: Key[], rows: TRecord[]) => {
        const currentRows = new Map<string, TRecord>();
        rows.forEach((record, index) => {
          const key = keys[index];
          if (key !== undefined) {
            currentRows.set(toKeyString(key), record);
          }
        });
        const nextMap = new Map(selectedRowMap);
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

        setSelectedRowMap(nextMap);
        if (value === undefined) {
          setInnerSelectedRowKeys(keys);
        }
        rowSelection?.onChange?.(keys, nextRows);
        onChange?.(keys, nextRows);
      },
    }),
    [multiple, onChange, rowSelection, selectedRowKeys, selectedRowMap, value],
  );

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
      onOk={() => onConfirm?.(selectedRowKeys, selectedRows)}
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
