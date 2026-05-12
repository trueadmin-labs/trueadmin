import { errorCenter } from '@trueadmin/web-core/error';
import type { Key } from 'react';
import { useCallback, useRef, useState } from 'react';

export type UseCrudRecordDetailOptions<TRecord> = {
  load: (id: Key) => Promise<TRecord>;
  onError?: (error: unknown) => false | undefined;
};

export type OpenCrudRecordOptions<TRecord> = {
  initialRecord?: TRecord;
};

export function useCrudRecordLoader<TRecord>({
  load,
  onError,
}: UseCrudRecordDetailOptions<TRecord>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<TRecord>();
  const requestIdRef = useRef(0);

  const openDetail = useCallback(
    async (id: Key, options?: OpenCrudRecordOptions<TRecord>) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setOpen(true);
      setLoading(true);
      setRecord(options?.initialRecord);

      try {
        const nextRecord = await load(id);
        if (requestIdRef.current === requestId) {
          setRecord(nextRecord);
        }
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }
        const shouldSkipGlobalError = onError?.(error);
        if (shouldSkipGlobalError !== false) {
          errorCenter.emit(error);
        }
        setOpen(false);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [load, onError],
  );

  const close = useCallback(() => {
    requestIdRef.current += 1;
    setOpen(false);
    setLoading(false);
    setRecord(undefined);
  }, []);

  return {
    close,
    loading,
    open,
    openDetail,
    openRecord: openDetail,
    record,
  };
}

export const useCrudRecordDetail = useCrudRecordLoader;
