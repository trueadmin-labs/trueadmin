import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import type { CardProps, CardSemanticStyles, CardStylesType } from 'antd/es/card/Card';
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

const mergeCardBodyStyles = (
  cardStyles: CardStylesType | undefined,
  bodyStyle: CSSProperties,
): CardStylesType => {
  const mergeBodyStyle = (nextStyles?: CardSemanticStyles): CardSemanticStyles => ({
    ...nextStyles,
    body: { ...bodyStyle, ...nextStyles?.body },
  });

  if (typeof cardStyles === 'function') {
    return (info: { props: CardProps }) => mergeBodyStyle(cardStyles(info));
  }

  return mergeBodyStyle(cardStyles);
};

export function TrueAdminCrudPage<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  title,
  description,
  extra,
  className,
  style,
  bodyClassName,
  bodyStyle,
  classNames,
  styles,
  titleCardProps,
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
  const contentStyle = {
    ...(hasAside
      ? {
          '--trueadmin-crud-aside-width': toSizeValue(asideWidth),
          '--trueadmin-crud-aside-gap': toSizeValue(asideGap),
        }
      : undefined),
    ...styles?.layout,
  } as CSSProperties;
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
      className={['trueadmin-crud-page', classNames?.root, className].filter(Boolean).join(' ')}
      bodyClassName={['trueadmin-crud-page-body', classNames?.body, bodyClassName]
        .filter(Boolean)
        .join(' ')}
      style={{ ...styles?.root, ...style }}
      bodyStyle={{ ...styles?.body, ...bodyStyle }}
    >
      <div
        className={['trueadmin-crud-page-stack', classNames?.stack].filter(Boolean).join(' ')}
        style={styles?.stack}
      >
        <Card
          {...titleCardProps}
          className={['trueadmin-crud-title-card', classNames?.titleCard, titleCardProps?.className]
            .filter(Boolean)
            .join(' ')}
          style={{ ...styles?.titleCard, ...titleCardProps?.style }}
          styles={mergeCardBodyStyles(titleCardProps?.styles, { padding: '10px 12px' })}
        >
          <div
            className={['trueadmin-crud-title-card-content', classNames?.titleCardContent]
              .filter(Boolean)
              .join(' ')}
            style={styles?.titleCardContent}
          >
            <div
              className={['trueadmin-crud-title-card-main', classNames?.titleCardMain]
                .filter(Boolean)
                .join(' ')}
              style={styles?.titleCardMain}
            >
              <Typography.Title
                className={['trueadmin-crud-title-card-title', classNames?.title]
                  .filter(Boolean)
                  .join(' ')}
                level={4}
                style={styles?.title}
              >
                {title}
              </Typography.Title>
              {description ? (
                <Typography.Text
                  className={['trueadmin-crud-title-card-description', classNames?.description]
                    .filter(Boolean)
                    .join(' ')}
                  style={styles?.description}
                  type="secondary"
                >
                  {description}
                </Typography.Text>
              ) : null}
            </div>
            {pageExtra ? (
              <div
                className={['trueadmin-crud-title-card-extra', classNames?.titleExtra]
                  .filter(Boolean)
                  .join(' ')}
                style={styles?.titleExtra}
              >
                {pageExtra}
              </div>
            ) : null}
          </div>
        </Card>
        <div
          className={['trueadmin-crud-page-layout', hasAside ? 'has-aside' : '', classNames?.layout]
            .filter(Boolean)
            .join(' ')}
          style={contentStyle}
        >
          {hasAside ? (
            <aside
              className={['trueadmin-crud-page-aside', classNames?.aside, asideClassName]
                .filter(Boolean)
                .join(' ')}
              style={{ ...styles?.aside, ...asideStyle }}
            >
              <div
                className={[
                  'trueadmin-crud-page-aside-body',
                  classNames?.asideBody,
                  asideBodyClassName,
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ ...styles?.asideBody, ...asideBodyStyle }}
              >
                {aside}
              </div>
            </aside>
          ) : null}
          <div
            className={['trueadmin-crud-page-main', classNames?.main].filter(Boolean).join(' ')}
            style={styles?.main}
          >
            <TrueAdminCrudTable resource={resource} service={service} {...tableProps} />
          </div>
        </div>
      </div>
    </TrueAdminPage>
  );
}
