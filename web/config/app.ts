import { env } from './env';

export const appConfig = {
  name: env.appName,
  logo: '/logo.svg',
  defaultLocale: 'zh-CN',
  defaultHome: '/workbench',
};
