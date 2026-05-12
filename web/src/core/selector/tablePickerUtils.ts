import type { Key } from 'react';

export const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

export const joinClassNames = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(Boolean).join(' ');

export const toKeyString = (key: Key) => String(key);
