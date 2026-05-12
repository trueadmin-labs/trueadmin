/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCrudRecordDetail } from './useCrudRecordDetail';

type TestRecord = {
  id: number;
};

const deferred = <TValue,>() => {
  let resolve!: (value: TValue) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    reject,
    resolve,
  };
};

describe('useCrudRecordDetail', () => {
  it('opens immediately, loads detail records, and ignores stale results after close', async () => {
    const request = deferred<TestRecord>();
    const { result } = renderHook(() =>
      useCrudRecordDetail<TestRecord>({ load: () => request.promise }),
    );

    let loadTask!: Promise<void>;
    act(() => {
      loadTask = result.current.openDetail(1);
    });

    expect(result.current.open).toBe(true);
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.close();
    });

    await act(async () => {
      request.resolve({ id: 1 });
      await loadTask;
    });

    expect(result.current.open).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.record).toBeUndefined();
  });

  it('keeps the initial record visible while the latest detail is loading', async () => {
    const request = deferred<TestRecord>();
    const { result } = renderHook(() =>
      useCrudRecordDetail<TestRecord>({ load: () => request.promise }),
    );

    let loadTask!: Promise<void>;
    act(() => {
      loadTask = result.current.openRecord(1, { initialRecord: { id: 1 } });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.loading).toBe(true);
    expect(result.current.record).toEqual({ id: 1 });

    await act(async () => {
      request.resolve({ id: 2 });
      await loadTask;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.record).toEqual({ id: 2 });
  });
});
