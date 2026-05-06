import { themeConfig } from '@config/index';
import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { StyleProvider } from 'antd-style';
import type { ReactNode } from 'react';
import { ErrorModalProvider } from '@/core/error/ErrorModalProvider';
import { I18nProvider } from '@/core/i18n/I18nProvider';
import { queryClient } from '@/core/query/client';
import { useLayoutStore } from '@/core/store/layoutStore';
import { useLocaleStore } from '@/core/store/localeStore';

const antdLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function AppProviders({ children }: { children: ReactNode }) {
  const darkMode = useLayoutStore((state) => state.darkMode);
  const locale = useLocaleStore((state) => state.locale);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={antdLocales[locale]}
        theme={{
          ...themeConfig,
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <StyleProvider hashPriority="high">
          <AntdApp>
            <I18nProvider>
              <ErrorModalProvider>{children}</ErrorModalProvider>
            </I18nProvider>
          </AntdApp>
        </StyleProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
