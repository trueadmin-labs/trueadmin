import {
  downloadFile,
  type TrueAdminDownloadInput,
  type TrueAdminDownloadOptions,
} from '@trueadmin/web-core/download';
import { App } from 'antd';
import { useCallback, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

export type UseTrueAdminDownloadOptions = {
  successMessage?: string | false;
  errorMessage?: string | false;
};

export function useTrueAdminDownload(options?: UseTrueAdminDownloadOptions) {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(
    async (
      input: TrueAdminDownloadInput,
      downloadOptions?: Omit<TrueAdminDownloadOptions, 'url'>,
    ) => {
      setDownloading(true);
      try {
        await downloadFile(input, downloadOptions);
        const successMessage = options?.successMessage;
        if (successMessage !== false) {
          message.success(successMessage ?? t('download.message.success', '已开始下载'));
        }
      } catch (error) {
        const errorMessage = options?.errorMessage;
        if (errorMessage !== false) {
          message.error(errorMessage ?? t('download.message.failed', '文件下载失败'));
        }
        throw error;
      } finally {
        setDownloading(false);
      }
    },
    [message, options?.errorMessage, options?.successMessage, t],
  );

  return { download, downloading };
}
