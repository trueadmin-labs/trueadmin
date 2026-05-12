import { requestConfig } from '@config/index';
import { ApiError } from '@trueadmin/web-core/error';
import type { ApiEnvelope } from '@trueadmin/web-core/http';
import { createAlova } from 'alova';
import { handleAuthUnauthorized, isAuthUnauthorizedCode } from '@/core/auth/session';
import { useLocaleStore } from '@/core/store/localeStore';

const isSuccessCode = (code: unknown): boolean => code === 'SUCCESS';

export const http = createAlova({
  baseURL: requestConfig.baseURL,
  cacheFor: null,
  timeout: requestConfig.timeout,
  requestAdapter: (elements) => {
    const controller = new AbortController();
    const headers = new Headers(elements.headers as HeadersInit | undefined);
    const locale = useLocaleStore.getState().locale;

    headers.set('Accept-Language', locale);
    headers.set('X-Page-Path', window.location.pathname);

    const token = localStorage.getItem('trueadmin.accessToken');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', ['Bearer', token].join(' '));
    }

    if (!(elements.data instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const body =
      elements.data instanceof FormData
        ? elements.data
        : JSON.stringify(elements.data ?? undefined);

    let responsePromise: Promise<Response> | undefined;
    const rawResponse = () => {
      responsePromise ??= fetch(elements.url, {
        method: elements.type,
        headers,
        body: ['GET', 'HEAD'].includes(elements.type) ? undefined : body,
        credentials: 'include',
        signal: controller.signal,
      });
      return responsePromise;
    };
    const response = async () => (await rawResponse()).clone();

    return {
      response,
      headers: async () => (await rawResponse()).headers,
      abort: () => controller.abort(),
    };
  },
  responded: {
    onSuccess: async (response: Response, method) => {
      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message =
          typeof payload === 'object' && payload !== null && 'message' in payload
            ? String(payload.message)
            : response.statusText;
        const code =
          typeof payload === 'object' && payload !== null && 'code' in payload
            ? String(payload.code)
            : `HTTP.${response.status}`;
        if (response.status === 401 || isAuthUnauthorizedCode(code)) {
          handleAuthUnauthorized();
        }
        throw new ApiError(code, message, response.status, payload);
      }

      const envelope = payload as ApiEnvelope<unknown>;
      if (
        typeof envelope === 'object' &&
        envelope !== null &&
        'code' in envelope &&
        !isSuccessCode(envelope.code)
      ) {
        if (isAuthUnauthorizedCode(envelope.code)) {
          handleAuthUnauthorized();
        }
        throw new ApiError(
          String(envelope.code),
          envelope.message || '请求失败',
          response.status,
          envelope,
        );
      }

      if (method.meta?.raw) {
        return payload;
      }

      return typeof envelope === 'object' && envelope !== null && 'data' in envelope
        ? envelope.data
        : payload;
    },
    onError: (error) => {
      throw error;
    },
  },
});
