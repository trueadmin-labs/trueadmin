import type { ApiError } from './ApiError';
import { normalizeError } from './normalizeError';
import type { ErrorPolicy } from './types';

type ErrorEvent = {
  error: ApiError;
  policy?: ErrorPolicy;
};

type ErrorListener = (event: ErrorEvent) => void;

const listeners = new Set<ErrorListener>();

const logError = (error: unknown, normalized: ApiError, policy?: ErrorPolicy) => {
  if (typeof console === 'undefined') {
    return;
  }

  console.error('[TrueAdminError]', {
    code: normalized.code,
    message: normalized.message,
    status: normalized.status,
    details: normalized.details,
    policy,
    error,
  });
};

export const errorCenter = {
  subscribe(listener: ErrorListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  emit(error: unknown, policy?: ErrorPolicy) {
    const normalized = normalizeError(error);
    logError(error, normalized, policy);
    for (const listener of listeners) {
      listener({ error: normalized, policy });
    }
  },
};
