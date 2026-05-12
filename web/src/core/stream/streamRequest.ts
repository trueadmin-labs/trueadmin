import { ApiError } from '@trueadmin/web-core/error';
import type { ApiEnvelope } from '@trueadmin/web-core/http';
import { buildStreamUrl, createStreamHeaders } from './requestUtils';
import { StreamError } from './StreamError';
import { SseDataParser } from './streamParser';
import type {
  StreamEventPayload,
  StreamRequestBody,
  StreamRequestOptions,
  StreamRequestResult,
} from './types';

const isSuccessCode = (code: unknown): boolean => code === 'SUCCESS';

const isEnvelope = <TData = unknown>(value: unknown): value is ApiEnvelope<TData> =>
  typeof value === 'object' && value !== null && 'code' in value && 'message' in value;

const parseErrorEnvelope = async (
  response: Response,
): Promise<ApiEnvelope<unknown> | undefined> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }

  try {
    const body = (await response.clone().json()) as unknown;
    return isEnvelope(body) ? body : undefined;
  } catch {
    return undefined;
  }
};

export const streamRequest = async <
  TData = unknown,
  TBody extends StreamRequestBody = StreamRequestBody,
>(
  url: string,
  options: StreamRequestOptions<TBody> = {},
): Promise<StreamRequestResult<TData>> => {
  const method = options.method ?? 'POST';
  const hasBody = options.body !== undefined && method !== 'GET';
  const headers = createStreamHeaders(options.headers, options.body, method);
  const events: StreamEventPayload[] = [];

  let response: Response;
  try {
    response = await fetch(buildStreamUrl(url, options.params), {
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
    const envelope = await parseErrorEnvelope(response);
    if (envelope) {
      throw new ApiError(
        String(envelope.code),
        envelope.message || response.statusText || '流式请求失败',
        response.status,
        envelope,
      );
    }

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
