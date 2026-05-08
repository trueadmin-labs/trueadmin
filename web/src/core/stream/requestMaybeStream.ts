import { http } from '@/core/http/client';
import { streamRequest } from './streamRequest';
import type { StreamEventPayload, StreamRequestMethod } from './types';

type RequestBody =
  | Record<string, unknown>
  | string
  | FormData
  | Blob
  | ArrayBuffer
  | URLSearchParams;

type RequestMaybeStreamOptions = {
  method?: StreamRequestMethod;
  body?: RequestBody;
  params?: Record<string, unknown>;
  stream?: boolean;
  signal?: AbortSignal;
  onEvent?: (event: StreamEventPayload) => void;
};

export const requestMaybeStream = async <TData = unknown>(
  url: string,
  options: RequestMaybeStreamOptions = {},
): Promise<TData> => {
  const method = options.method ?? 'POST';

  if (options.stream) {
    const result = await streamRequest<TData, RequestBody>(url, {
      method,
      body: options.body,
      signal: options.signal,
      onEvent: options.onEvent,
    });

    return result.data as TData;
  }

  switch (method) {
    case 'GET':
      return http.Get<TData>(url, { params: options.params }).send();
    case 'PUT':
      return http.Put<TData>(url, options.body).send();
    case 'PATCH':
      return http.Patch<TData>(url, options.body).send();
    case 'DELETE':
      return http.Delete<TData>(url, options.body).send();
    default:
      return http.Post<TData>(url, options.body).send();
  }
};
