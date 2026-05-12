import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type TrueAdminFileRecord,
  type TrueAdminRemoteUploadOptions,
  type TrueAdminUploadOptions,
  uploadTrueAdminFile,
  uploadTrueAdminRemoteFile,
} from './fileApi';

export type TrueAdminResolvedUploadOptions = Required<TrueAdminUploadOptions>;

export type TrueAdminResolvedRemoteUploadOptions = TrueAdminResolvedUploadOptions & {
  filename?: string;
};

export type TrueAdminUploadFileHandler<TResult = TrueAdminFileRecord> = (
  file: File,
  options: TrueAdminResolvedUploadOptions,
) => Promise<TResult>;

export type TrueAdminUploadRemoteHandler<TResult = TrueAdminFileRecord> = (
  url: string,
  options: TrueAdminResolvedRemoteUploadOptions,
) => Promise<TResult>;

export type UseTrueAdminUploadOptions<TResult = TrueAdminFileRecord> = TrueAdminUploadOptions & {
  uploadFile?: TrueAdminUploadFileHandler<TResult>;
  uploadRemoteFile?: TrueAdminUploadRemoteHandler<TResult>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

export type UseTrueAdminUploadResult<TResult = TrueAdminFileRecord> = {
  upload: (file: File, options?: TrueAdminUploadOptions) => Promise<TResult>;
  uploadRemote: (url: string, options?: TrueAdminRemoteUploadOptions) => Promise<TResult>;
  uploading: boolean;
  error: unknown;
  reset: () => void;
};

const defaultUploadOptions: TrueAdminResolvedUploadOptions = {
  category: 'attachment',
  visibility: 'public',
};

export function useTrueAdminUpload<TResult = TrueAdminFileRecord>({
  category = defaultUploadOptions.category,
  visibility = defaultUploadOptions.visibility,
  uploadFile = uploadTrueAdminFile as unknown as TrueAdminUploadFileHandler<TResult>,
  uploadRemoteFile = uploadTrueAdminRemoteFile as unknown as TrueAdminUploadRemoteHandler<TResult>,
  onSuccess,
  onError,
}: UseTrueAdminUploadOptions<TResult> = {}): UseTrueAdminUploadResult<TResult> {
  const activeCountRef = useRef(0);
  const mountedRef = useRef(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const beginUpload = useCallback(() => {
    activeCountRef.current += 1;
    if (mountedRef.current) {
      setError(undefined);
      setUploading(true);
    }
  }, []);

  const finishUpload = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (mountedRef.current) {
      setUploading(activeCountRef.current > 0);
    }
  }, []);

  const execute = useCallback(
    async (task: () => Promise<TResult>) => {
      beginUpload();
      try {
        const result = await task();
        onSuccess?.(result);
        return result;
      } catch (nextError) {
        if (mountedRef.current) {
          setError(nextError);
        }
        onError?.(nextError);
        throw nextError;
      } finally {
        finishUpload();
      }
    },
    [beginUpload, finishUpload, onError, onSuccess],
  );

  const upload = useCallback(
    (file: File, options: TrueAdminUploadOptions = {}) =>
      execute(() =>
        uploadFile(file, {
          category: options.category ?? category,
          visibility: options.visibility ?? visibility,
        }),
      ),
    [category, execute, uploadFile, visibility],
  );

  const uploadRemote = useCallback(
    (url: string, options: TrueAdminRemoteUploadOptions = {}) =>
      execute(() =>
        uploadRemoteFile(url, {
          category: options.category ?? category,
          filename: options.filename,
          visibility: options.visibility ?? visibility,
        }),
      ),
    [category, execute, uploadRemoteFile, visibility],
  );

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setError(undefined);
    }
  }, []);

  return {
    error,
    reset,
    upload,
    uploadRemote,
    uploading,
  };
}
