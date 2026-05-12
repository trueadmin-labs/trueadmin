import { errorCenter } from '@trueadmin/web-core/error';
import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CrudListParams, CrudPageResult, TrueAdminCrudTableProps } from './types';

type UseCrudTableDataOptions<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = Pick<
  TrueAdminCrudTableProps<TRecord, TCreate, TUpdate, TMeta>,
  | 'beforeRequest'
  | 'onCreateSuccess'
  | 'onDeleteSuccess'
  | 'onLoadError'
  | 'onLoadSuccess'
  | 'onUpdateSuccess'
  | 'service'
  | 'transformParams'
  | 'transformResponse'
> & {
  clearSelected: () => void;
  requestParams: CrudListParams;
  resource: string;
};

export const useCrudTableData = <
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  beforeRequest,
  clearSelected,
  onCreateSuccess,
  onDeleteSuccess,
  onLoadError,
  onLoadSuccess,
  onUpdateSuccess,
  requestParams,
  resource,
  service,
  transformParams,
  transformResponse,
}: UseCrudTableDataOptions<TRecord, TCreate, TUpdate, TMeta>) => {
  const [dataSource, setDataSource] = useState<TRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrudPageResult<TRecord, TMeta>>();
  const [error, setError] = useState<unknown>();
  const reloadSeedRef = useRef(0);
  const [reloadSeed, setReloadSeed] = useState(0);

  const reload = useCallback(() => {
    reloadSeedRef.current += 1;
    setReloadSeed(reloadSeedRef.current);
  }, []);

  const createRecord = useCallback(
    async (payload: TCreate) => {
      if (!service.create) {
        throw new Error('Create service is not configured.');
      }

      const record = await service.create(payload);
      onCreateSuccess?.(record, { payload, resource });
      reload();
      return record;
    },
    [onCreateSuccess, reload, resource, service],
  );

  const updateRecord = useCallback(
    async (id: Key, payload: TUpdate) => {
      if (!service.update) {
        throw new Error('Update service is not configured.');
      }

      const record = await service.update(id, payload);
      onUpdateSuccess?.(record, { id, payload, resource });
      reload();
      return record;
    },
    [onUpdateSuccess, reload, resource, service],
  );

  const deleteRecord = useCallback(
    async (id: Key) => {
      if (!service.delete) {
        throw new Error('Delete service is not configured.');
      }

      const result = await service.delete(id);
      onDeleteSuccess?.(result, { id, resource });
      clearSelected();
      reload();
      return result;
    },
    [clearSelected, onDeleteSuccess, reload, resource, service],
  );

  const action = useMemo(
    () => ({
      clearSelected,
      create: service.create ? createRecord : undefined,
      delete: service.delete ? deleteRecord : undefined,
      reload,
      update: service.update ? updateRecord : undefined,
    }),
    [
      clearSelected,
      createRecord,
      deleteRecord,
      reload,
      service.create,
      service.delete,
      service.update,
      updateRecord,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const context = { resource };
      const baseParams = requestParams;
      let finalRequestParams = baseParams;

      setLoading(true);
      setError(undefined);

      try {
        const beforeResult = await beforeRequest?.(baseParams, context);
        if (cancelled || beforeResult === false) {
          return;
        }

        finalRequestParams = transformParams
          ? await transformParams(baseParams, context)
          : baseParams;

        if (cancelled) {
          return;
        }

        const result = await service.list(finalRequestParams, {
          force: reloadSeed > 0,
          reloadSeed,
        });
        if (cancelled) {
          return;
        }

        const loadContext = { params: finalRequestParams, resource };
        const finalResult = transformResponse
          ? await transformResponse(result, loadContext)
          : result;

        if (cancelled) {
          return;
        }

        setDataSource(finalResult.items ?? []);
        setTotal(finalResult.total ?? 0);
        setResponse(finalResult);
        onLoadSuccess?.(finalResult, loadContext);
      } catch (error) {
        if (!cancelled) {
          setError(error);
          const shouldSkipGlobalError = onLoadError?.(error, {
            params: finalRequestParams,
            resource,
          });
          if (shouldSkipGlobalError !== false) {
            errorCenter.emit(error);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [
    beforeRequest,
    onLoadError,
    onLoadSuccess,
    reloadSeed,
    requestParams,
    resource,
    service,
    transformParams,
    transformResponse,
  ]);

  return {
    action,
    createRecord,
    dataSource,
    error,
    deleteRecord,
    loading,
    reload,
    response,
    total,
    updateRecord,
  };
};
