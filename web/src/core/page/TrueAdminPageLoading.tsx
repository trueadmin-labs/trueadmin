import { Spin, Typography } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import './page.css';

export type TrueAdminPageLoadingProps = {
  fullscreen?: boolean;
};

export function TrueAdminPageLoading({ fullscreen = false }: TrueAdminPageLoadingProps) {
  const { t } = useI18n();
  const text = t('page.loading.enter', '正在进入页面');

  if (fullscreen) {
    return <Spin fullscreen description={text} />;
  }

  return (
    <div className="trueadmin-page-loading" aria-live="polite" aria-busy="true">
      <Spin />
      <Typography.Text type="secondary">{text}</Typography.Text>
    </div>
  );
}
