export const stringifyRawSearchParams = (params: URLSearchParams) =>
  Array.from(params.entries())
    .filter(([key]) => key.length > 0)
    .map(([key, value]) => (value.length > 0 ? `${key}=${value}` : key))
    .join('&');

export const updateRawSearchParams = (
  current: URLSearchParams,
  updater: (params: URLSearchParams) => void,
) => {
  const next = new URLSearchParams(current);
  updater(next);
  return stringifyRawSearchParams(next);
};
