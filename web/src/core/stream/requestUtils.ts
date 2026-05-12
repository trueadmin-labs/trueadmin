import { requestConfig } from '@config/index';
import { stringifyRawSearchParams } from '@trueadmin/web-core/url';
import { useLocaleStore } from '@/core/store/localeStore';
import type { StreamRequestBody, StreamRequestParams } from './types';

export const appendStreamSearchParams = (url: string, params?: StreamRequestParams): string => {
  if (!params) {
    return url;
  }

  const searchParams = params instanceof URLSearchParams ? params : new URLSearchParams();
  if (!(params instanceof URLSearchParams)) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
  }

  const query = stringifyRawSearchParams(searchParams);
  if (query === '') {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
};

export const buildStreamUrl = (url: string, params?: StreamRequestParams): string => {
  const baseUrl = /^https?:\/\//.test(url)
    ? url
    : `${requestConfig.baseURL}${url.startsWith('/') ? url : `/${url}`}`;

  return appendStreamSearchParams(baseUrl, params);
};

export const createStreamHeaders = <TBody extends StreamRequestBody = StreamRequestBody>(
  headers?: HeadersInit,
  body?: TBody,
  method = 'GET',
): Headers => {
  const result = new Headers(headers);
  const locale = useLocaleStore.getState().locale;
  const token = localStorage.getItem('trueadmin.accessToken');
  const hasBody = body !== undefined && !['GET', 'HEAD'].includes(method);

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
