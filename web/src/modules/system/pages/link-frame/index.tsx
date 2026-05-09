import { Alert, Result } from 'antd';
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

  return (
    <TrueAdminPage layout="workspace" fullHeight contentPadding={false}>
      <LoadingContainer loading={loading} keepChildren={false} className="trueadmin-system-link-frame-loading">
        {!menu ? (
          <Result status="404" title={t('system.linkFrame.notFound', '链接资源不存在')} />
        ) : !valid ? (
          <Result status="warning" title={t('system.linkFrame.invalid', '链接地址无效')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <Alert
              type="info"
              showIcon
              message={menu.name}
              description={url}
              style={{ borderRadius: 0, borderInline: 0, borderTop: 0 }}
            />
            <iframe
              title={menu.name}
              src={url}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ flex: 1, width: '100%', minHeight: 0, border: 0, background: '#fff' }}
            />
          </div>
        )}
      </LoadingContainer>
    </TrueAdminPage>
  );
}
