import { Result } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

export default function ForbiddenPage() {
  const { t } = useI18n();

  return (
    <TrueAdminPage title={t('permission.forbidden.title', '无权访问')}>
      <Result
        status="403"
        title={t('permission.forbidden.title', '无权访问')}
        subTitle={t('permission.forbidden.pageDescription', '当前账号没有访问此页面的权限。')}
      />
    </TrueAdminPage>
  );
}
