import type { ApiEnvelope } from '@/core/http/types';

export type StreamEventType = 'progress' | 'debug' | 'result' | 'completed' | 'error' | string;

export type StreamEventPayload = {
  type: StreamEventType;
  message: string;
  code?: string;
  module?: string;
  stage?: string;
  current?: number;
  total?: number;
  percent?: number;
  payload?: unknown;
  response?: ApiEnvelope<unknown> | unknown;
};

export type StreamRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StreamRequestOptions<TBody = unknown> = {
  method?: StreamRequestMethod;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  onEvent?: (event: StreamEventPayload) => void;
};

export type StreamRequestResult<TData = unknown> = {
  events: StreamEventPayload[];
  envelope?: ApiEnvelope<TData>;
  data?: TData;
  completed: boolean;
};
