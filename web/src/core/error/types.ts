import type { ReactNode } from 'react';
import type { RenderableTrans, TranslateFunction } from '@/core/i18n/trans';
import type { ApiError } from './ApiError';

export type ErrorSeverity = 'info' | 'warning' | 'error';

export type ErrorRenderContext = {
  error: ApiError;
  t: TranslateFunction;
  reason?: string;
  traceId?: string;
};

export type ErrorRenderable = RenderableTrans<ErrorRenderContext>;

export type ErrorExplanation = {
  title?: ErrorRenderable;
  description?: ErrorRenderable;
  causes?: ErrorRenderable[];
  suggestions?: ErrorRenderable[];
  extra?: (context: ErrorRenderContext) => ReactNode;
  severity?: ErrorSeverity;
  docUrl?: string;
};

export type ErrorDisplayMode = 'modal' | 'message' | 'silent' | 'form' | 'page';

export type ErrorPolicy = {
  mode?: ErrorDisplayMode;
  field?: string;
};

export type ErrorRegistry = Record<string, ErrorExplanation>;
