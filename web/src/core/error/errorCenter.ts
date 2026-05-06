import type { ApiError } from './ApiError';
import { normalizeError } from './normalizeError';
import type { ErrorPolicy } from './types';

type ErrorEvent = {
  error: ApiError;
  policy?: ErrorPolicy;
};

type ErrorListener = (event: ErrorEvent) => void;

const listeners = new Set<ErrorListener>();

export const errorCenter = {
  subscribe(listener: ErrorListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  emit(error: unknown, policy?: ErrorPolicy) {
    const normalized = normalizeError(error);
    for (const listener of listeners) {
      listener({ error: normalized, policy });
    }
  },
};
