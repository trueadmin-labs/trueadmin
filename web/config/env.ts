const booleanValue = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const numberValue = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'TrueAdmin',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  enableMsw: booleanValue(import.meta.env.VITE_ENABLE_MSW),
  isDev: import.meta.env.DEV,
  isTest: import.meta.env.MODE === 'test',
  requestTimeout: numberValue(import.meta.env.VITE_REQUEST_TIMEOUT, 15000),
};
