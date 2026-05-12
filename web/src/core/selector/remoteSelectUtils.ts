import type { TrueAdminRemoteSelectValue } from './remoteSelectTypes';

export const DEFAULT_SEARCH_DELAY = 300;
export const DEFAULT_PAGE_SIZE = 20;

export const toValueArray = <TValue extends TrueAdminRemoteSelectValue>(
  value: TValue | TValue[] | undefined,
): TValue[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

export const toValueKey = (value: TrueAdminRemoteSelectValue) => String(value);
