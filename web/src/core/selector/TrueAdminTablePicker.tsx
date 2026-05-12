import type { Key, ReactNode } from 'react';
import { TrueAdminCrudTable } from '@/core/crud/TrueAdminCrudTable';
import type { TrueAdminCrudTableProps } from '@/core/crud/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPageModal, type TrueAdminPageModalProps } from '@/core/modal/TrueAdminPageModal';
import { TrueAdminTablePickerFrame } from './TrueAdminTablePickerFrame';
import { joinClassNames } from './tablePickerUtils';
import { useTablePickerSelection } from './useTablePickerSelection';

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
  const { confirmSelection, mergedRowSelection } = useTablePickerSelection<
    TRecord,
    TCreate,
    TUpdate,
    TMeta
  >({
    controlledSelectedRows,
    defaultValue,
    isValueControlled,
    multiple,
    onChange,
    onConfirm,
    open,
    rowKey: crudTableProps.rowKey,
    rowSelection,
    value,
  });

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
      <TrueAdminTablePickerFrame<TRecord, TCreate, TUpdate, TMeta>
        aside={aside}
        asideGap={asideGap}
        asideWidth={asideWidth}
        className={className}
        classNames={classNames}
        style={style}
        styles={styles}
      >
        {tableDom}
      </TrueAdminTablePickerFrame>
    </TrueAdminPageModal>
  );
}
