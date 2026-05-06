import { appConfig } from '@config/index';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh-CN' | 'en-US';

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: appConfig.defaultLocale as Locale,
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'trueadmin.locale' },
  ),
);
