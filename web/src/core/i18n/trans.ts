import type { ReactNode } from 'react';

export type TransText = {
  readonly __trans: true;
  readonly key: string;
  readonly fallback?: string;
};

export type TranslateFunction = (key?: string, fallback?: string) => string;

export const trans = (key: string, fallback?: string): TransText => ({
  __trans: true,
  key,
  fallback,
});

export const isTransText = (value: unknown): value is TransText =>
  typeof value === 'object' && value !== null && '__trans' in value && value.__trans === true;

export const resolveTrans = (
  value: string | TransText | undefined,
  translate: TranslateFunction,
  fallback = '',
): string => {
  if (isTransText(value)) {
    return translate(value.key, value.fallback ?? fallback);
  }

  return value ?? fallback;
};

export type RenderableTrans<TContext> = string | TransText | ((context: TContext) => ReactNode);

export const resolveRenderableTrans = <TContext>(
  value: RenderableTrans<TContext> | undefined,
  context: TContext,
  translate: TranslateFunction,
  fallback = '',
): ReactNode => {
  if (typeof value === 'function') {
    return value(context);
  }

  return resolveTrans(value, translate, fallback);
};
