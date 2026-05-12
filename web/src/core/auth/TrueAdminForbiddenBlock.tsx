import { Result } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';

type TrueAdminForbiddenBlockProps = {
  title?: string;
  subTitle?: string;
};

export function TrueAdminForbiddenBlock({ title, subTitle }: TrueAdminForbiddenBlockProps) {
  const { t } = useI18n();

  return (
    <Result
      className="trueadmin-forbidden-block"
      status="403"
      title={title ?? t('permission.forbidden.title', '无权访问')}
      subTitle={subTitle ?? t('permission.forbidden.description', '当前账号没有访问此内容的权限。')}
    />
  );
}
