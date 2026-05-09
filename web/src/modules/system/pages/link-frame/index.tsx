import { ExportOutlined } from '@ant-design/icons';
import { Button, Result, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { LoadingContainer } from '@/core/loading/LoadingContainer';
import { TrueAdminPage } from '@/core/page';
import { useI18n } from '@/core/i18n/I18nProvider';
import { menuApi } from '../../services/menu.api';
import type { AdminMenu } from '../../types/menu';

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export default function LinkFramePage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<AdminMenu>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!id) {
      setMenu(undefined);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void menuApi.detail(id).then((nextMenu) => {
      if (active) {
        setMenu(nextMenu);
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id]);

  const url = menu?.url ?? '';
  const valid = useMemo(() => isHttpUrl(url), [url]);
  const showHeader = Boolean(menu?.showLinkHeader);

  return (
    <TrueAdminPage layout="workspace" fullHeight contentPadding={false} bodyClassName="trueadmin-system-link-frame-page-body">
      <LoadingContainer loading={loading} keepChildren={false} layout="viewport" className="trueadmin-system-link-frame-loading">
        {!menu ? (
          <Result status="404" title={t('system.linkFrame.notFound', '链接资源不存在')} />
        ) : !valid ? (
          <Result status="warning" title={t('system.linkFrame.invalid', '链接地址无效')} />
        ) : (
          <div className="trueadmin-system-link-frame">
            {showHeader ? (
              <div className="trueadmin-system-link-frame-header">
                <Typography.Text strong ellipsis className="trueadmin-system-link-frame-title">
                  {menu.name}
                </Typography.Text>
                <Typography.Text code ellipsis className="trueadmin-system-link-frame-url">
                  {url}
                </Typography.Text>
                <Button
                  icon={<ExportOutlined />}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('system.linkFrame.openExternal', '新标签页打开')}
                </Button>
              </div>
            ) : null}
            <iframe
              title={menu.name}
              src={url}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
              referrerPolicy="no-referrer-when-downgrade"
              className="trueadmin-system-link-frame-iframe"
            />
          </div>
        )}
      </LoadingContainer>
    </TrueAdminPage>
  );
}
