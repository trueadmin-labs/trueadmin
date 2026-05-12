/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTrueAdminUpload } from './useTrueAdminUpload';

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

describe('useTrueAdminUpload', () => {
  it('runs file uploads with default options and exposes uploading state', async () => {
    const request = deferred<{ id: number; url: string }>();
    const uploadFile = vi.fn(() => request.promise);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTrueAdminUpload({ uploadFile, onSuccess }));
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    let uploadTask!: Promise<{ id: number; url: string }>;
    act(() => {
      uploadTask = result.current.upload(file);
    });

    expect(result.current.uploading).toBe(true);
    expect(uploadFile).toHaveBeenCalledWith(file, {
      category: 'attachment',
      visibility: 'public',
    });

    await act(async () => {
      request.resolve({ id: 1, url: '/uploads/avatar.png' });
      await uploadTask;
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).toHaveBeenCalledWith({ id: 1, url: '/uploads/avatar.png' });
  });

  it('lets call-time options override hook defaults for file and remote uploads', async () => {
    const uploadFile = vi.fn(async () => ({ id: 1 }));
    const uploadRemoteFile = vi.fn(async () => ({ id: 2 }));
    const { result } = renderHook(() =>
      useTrueAdminUpload({
        category: 'announcement',
        visibility: 'private',
        uploadFile,
        uploadRemoteFile,
      }),
    );
    const file = new File(['contract'], 'contract.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.upload(file, { category: 'contract' });
      await result.current.uploadRemote('https://example.com/report.pdf', {
        filename: 'report.pdf',
        visibility: 'public',
      });
    });

    expect(uploadFile).toHaveBeenCalledWith(file, {
      category: 'contract',
      visibility: 'private',
    });
    expect(uploadRemoteFile).toHaveBeenCalledWith('https://example.com/report.pdf', {
      category: 'announcement',
      filename: 'report.pdf',
      visibility: 'public',
    });
  });

  it('stores failed upload errors and can reset them', async () => {
    const uploadError = new Error('upload failed');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useTrueAdminUpload({
        uploadFile: async () => {
          throw uploadError;
        },
        onError,
      }),
    );

    await act(async () => {
      await expect(
        result.current.upload(new File(['x'], 'broken.txt', { type: 'text/plain' })),
      ).rejects.toThrow(uploadError);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBe(uploadError);
    expect(onError).toHaveBeenCalledWith(uploadError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeUndefined();
  });
});
