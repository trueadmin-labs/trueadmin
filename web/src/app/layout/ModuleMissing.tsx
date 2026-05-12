import { Result } from 'antd';
import { useLocation } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import type { BackendMenu } from '@/core/menu/types';
import { TrueAdminPageLoading } from '@/core/page';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const hasMenuPath = (menus: BackendMenu[] | undefined, pathname: string): boolean => {
  const currentPath = normalizePath(pathname);

  return (menus ?? []).some((menu) => {
    if (menu.type !== 'button' && normalizePath(menu.path) === currentPath) {
      return true;
    }

    return hasMenuPath(menu.children, pathname);
  });
};

export function ModuleMissing() {
  const location = useLocation();
  const { t } = useI18n();
  const { data: menus, isLoading } = useMenuTreeQuery();

  if (isLoading) {
    return <TrueAdminPageLoading />;
  }

  const menuExists = hasMenuPath(menus, location.pathname);

  if (!menuExists) {
    return (
      <TrueAdminPage title={t('page.notFound.title', '404')}>
        <Result
          status="404"
          title={t('page.notFound.title', '404')}
          subTitle={t('page.notFound.description', '页面不存在。')}
        />
      </TrueAdminPage>
    );
  }

  return (
    <TrueAdminPage title={t('page.moduleMissing.title', '页面未安装')}>
      <Result
        status="404"
        title={t('page.moduleMissing.title', '页面未安装')}
        subTitle={t(
          'page.moduleMissing.description',
          '当前路径 {{path}} 已由后端菜单下发，但前端模块还没有提供对应页面。',
        ).replace('{{path}}', location.pathname)}
      />
    </TrueAdminPage>
  );
}
