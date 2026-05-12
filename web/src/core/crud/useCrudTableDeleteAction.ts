import type { Key } from 'react';
import { useCallback } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import type { TranslateFunction } from '@/core/i18n/trans';
import type { CrudTableLocale, TrueAdminCrudTableProps } from './types';

type UseCrudTableDeleteActionOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = Pick<TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>, 'onDeleteSuccess'> & {
  deleteRecord: (id: Key) => Promise<unknown>;
  getRecordKey: (record: TRecord) => Key;
  locale?: CrudTableLocale;
  notifySuccess: (content: string) => void;
  t: TranslateFunction;
};

export function useCrudTableDeleteAction<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  deleteRecord,
  getRecordKey,
  locale,
  notifySuccess,
  onDeleteSuccess,
  t,
}: UseCrudTableDeleteActionOptions<TRecord, TCreate, TUpdate, TMeta>) {
  return useCallback(
    async (record: TRecord) => {
      try {
        await deleteRecord(getRecordKey(record));
        if (!onDeleteSuccess) {
          notifySuccess(locale?.deleteSuccessMessage ?? t('crud.action.deleteSuccess', '删除成功'));
        }
      } catch (error) {
        errorCenter.emit(error);
      }
    },
    [deleteRecord, getRecordKey, locale?.deleteSuccessMessage, notifySuccess, onDeleteSuccess, t],
  );
}
