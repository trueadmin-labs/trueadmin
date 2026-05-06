import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { enabledManifests } from '@/core/module/registry';
import { type Locale, useLocaleStore } from '@/core/store/localeStore';
import { coreMessages } from './coreMessages';

type I18nContextValue = {
  locale: Locale;
  messages: Record<string, string>;
  t: (key?: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const loadMessages = async (locale: Locale): Promise<Record<string, string>> => {
  const chunks = await Promise.all(
    enabledManifests
      .map((manifest) => manifest.locales?.[locale])
      .filter((loader): loader is NonNullable<typeof loader> => Boolean(loader))
      .map(async (loader) => {
        const module = await loader();
        return 'default' in module ? module.default : module;
      }),
  );

  return Object.assign({}, coreMessages[locale], ...chunks);
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    let disposed = false;
    loadMessages(locale).then((nextMessages) => {
      if (!disposed) {
        setMessages(nextMessages);
      }
    });

    return () => {
      disposed = true;
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      t: (key, fallback) => (key ? messages[key] || fallback || key : fallback || ''),
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (value === null) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return value;
};
