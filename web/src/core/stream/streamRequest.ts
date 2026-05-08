import { requestConfig } from '@config/index';
import { ApiError } from '@/core/error/ApiError';
import type { ApiEnvelope } from '@/core/http/types';
import { useLocaleStore } from '@/core/store/localeStore';
import { StreamError } from './StreamError';
import { SseDataParser } from './streamParser';
import type { StreamEventPayload, StreamRequestOptions, StreamRequestResult } from './types';

const isSuccessCode = (code: string | number): boolean =>
  code === 0 || code === '0' || code === 'SUCCESS' || code === 'KERNEL.SUCCESS';

const isEnvelope = <TData = unknown>(value: unknown): value is ApiEnvelope<TData> =>
  typeof value === 'object' && value !== null && 'code' in value && 'message' in value;

const buildUrl = (url: string): string => {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return `${requestConfig.baseURL}${url.startsWith('/') ? url : `/${url}`}`;
};

const createHeaders = (headers?: HeadersInit, hasBody = false): Headers => {
  const result = new Headers(headers);
  const locale = useLocaleStore.getState().locale;
  const token = localStorage.getItem('trueadmin.accessToken');

  result.set('Accept', 'text/event-stream');
  result.set('Accept-Language', locale);
  result.set('X-Page-Path', window.location.pathname);

  if (token && !result.has('Authorization')) {
    result.set('Authorization', ['Bearer', token].join(' '));
  }

  if (hasBody && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json');
  }

  return result;
};

export const streamRequest = async <TData = unknown, TBody = unknown>(
  url: string,
  options: StreamRequestOptions<TBody> = {},
): Promise<StreamRequestResult<TData>> => {
  const method = options.method ?? 'POST';
  const hasBody = options.body !== undefined && method !== 'GET';
  const headers = createHeaders(options.headers, hasBody);
  const events: StreamEventPayload[] = [];

  let response: Response;
  try {
    response = await fetch(buildUrl(url), {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new StreamError('aborted', '操作已取消', 'STREAM.ABORTED', error);
    }

    throw new StreamError('network', '流式连接建立失败', 'STREAM.NETWORK', error);
  }

  if (!response.ok) {
    throw new StreamError(
      'network',
      response.statusText || '流式请求失败',
      `HTTP.${response.status}`,
    );
  }

  if (!response.body) {
    throw new StreamError('protocol', '当前浏览器不支持流式响应读取');
  }

  const decoder = new TextDecoder();
  const parser = new SseDataParser();
  const reader = response.body.getReader();
  let doneReceived = false;
  let completed = false;
  let envelope: ApiEnvelope<TData> | undefined;

  const handleEvent = (event: StreamEventPayload) => {
    events.push(event);
    options.onEvent?.(event);

    if (event.type === 'result') {
      if (!isEnvelope<TData>(event.response)) {
        throw new StreamError(
          'protocol',
          '流式响应 result 块缺少标准接口响应',
          'STREAM.MISSING_RESULT_RESPONSE',
          event,
        );
      }

      envelope = event.response;
      if (!isSuccessCode(envelope.code)) {
        throw new ApiError(
          String(envelope.code),
          envelope.message || '请求失败',
          undefined,
          envelope,
        );
      }
    }

    if (event.type === 'completed') {
      completed = true;
    }

    if (event.type === 'error') {
      if (isEnvelope(event.response)) {
        throw new ApiError(
          String(event.response.code),
          event.response.message || '请求失败',
          undefined,
          event.response,
        );
      }

      throw new StreamError('backend', event.message || '后端处理失败', event.code, event);
    }
  };

  const handleParsed = (items: ReturnType<SseDataParser['push']>) => {
    for (const item of items) {
      if (item.type === 'done') {
        doneReceived = true;
        continue;
      }

      handleEvent(item.event);
    }
  };

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      handleParsed(parser.push(decoder.decode(result.value, { stream: true })));
    }

    handleParsed(parser.push(decoder.decode()));
    handleParsed(parser.flush());
  } catch (error) {
    if (error instanceof StreamError || error instanceof ApiError) {
      throw error;
    }

    if (options.signal?.aborted) {
      throw new StreamError('aborted', '操作已取消', 'STREAM.ABORTED', error);
    }

    throw new StreamError('network', '流式连接中断', 'STREAM.NETWORK_INTERRUPTED', error);
  } finally {
    reader.releaseLock();
  }

  if (!doneReceived) {
    throw new StreamError('network', '流式连接异常中断，未收到结束标记', 'STREAM.MISSING_DONE');
  }

  if (!completed) {
    throw new StreamError('protocol', '流式响应未返回完成状态', 'STREAM.MISSING_COMPLETED', events);
  }

  if (!envelope) {
    throw new StreamError('protocol', '流式响应未返回最终结果', 'STREAM.MISSING_RESULT', events);
  }

  return { events, envelope, data: envelope.data, completed };
};
