import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { Permission } from '@/core/auth/Permission';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';
import { TrueAdminCrudTable } from './TrueAdminCrudTable';
import type { TrueAdminCrudPageProps } from './types';

const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

const toPermissionCode = (resource: string, action: string) =>
  `${resource.replaceAll('.', ':')}:${action}`;

export function TrueAdminCrudPage<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  title,
  description,
  extra,
  aside,
  asideWidth = 280,
  asideGap = 10,
  asideClassName,
  asideStyle,
  asideBodyClassName,
  asideBodyStyle,
  resource,
  service,
  ...tableProps
}: TrueAdminCrudPageProps<TRecord, TCreate, TUpdate, TMeta>) {
  const { t } = useI18n();
  const hasAside = Boolean(aside);
  const contentStyle = hasAside
    ? ({
        '--trueadmin-crud-aside-width': toSizeValue(asideWidth),
        '--trueadmin-crud-aside-gap': toSizeValue(asideGap),
      } as CSSProperties)
    : undefined;
  const defaultExtra = service.create ? (
    <Permission code={toPermissionCode(resource, 'create')}>
      <Button type="primary" icon={<PlusOutlined />} disabled>
        {t('crud.action.create', '新增')}
      </Button>
    </Permission>
  ) : null;
  const pageExtra = extra ?? defaultExtra;

  return (
    <TrueAdminPage
      layout="workspace"
      className="trueadmin-crud-page"
      bodyClassName="trueadmin-crud-page-body"
    >
      <div className="trueadmin-crud-page-stack">
        <Card className="trueadmin-crud-title-card" styles={{ body: { padding: '10px 12px' } }}>
          <div className="trueadmin-crud-title-card-content">
            <div className="trueadmin-crud-title-card-main">
              <Typography.Title className="trueadmin-crud-title-card-title" level={4}>
                {title}
              </Typography.Title>
              {description ? (
                <Typography.Text className="trueadmin-crud-title-card-description" type="secondary">
                  {description}
                </Typography.Text>
              ) : null}
            </div>
            {pageExtra ? <div className="trueadmin-crud-title-card-extra">{pageExtra}</div> : null}
          </div>
        </Card>
        <div
          className={
            hasAside ? 'trueadmin-crud-page-layout has-aside' : 'trueadmin-crud-page-layout'
          }
          style={contentStyle}
        >
          {hasAside ? (
            <aside
              className={['trueadmin-crud-page-aside', asideClassName].filter(Boolean).join(' ')}
              style={asideStyle}
            >
              <div
                className={['trueadmin-crud-page-aside-body', asideBodyClassName]
                  .filter(Boolean)
                  .join(' ')}
                style={asideBodyStyle}
              >
                {aside}
              </div>
            </aside>
          ) : null}
          <div className="trueadmin-crud-page-main">
            <TrueAdminCrudTable resource={resource} service={service} {...tableProps} />
          </div>
        </div>
      </div>
    </TrueAdminPage>
  );
}
