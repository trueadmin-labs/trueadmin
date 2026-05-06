import { Result } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';

type ForbiddenBlockProps = {
  title?: string;
  subTitle?: string;
};

export function ForbiddenBlock({ title, subTitle }: ForbiddenBlockProps) {
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
