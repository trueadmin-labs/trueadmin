import type { CSSProperties, ReactNode } from 'react';
import { TrueAdminPage, type TrueAdminPageProps } from './TrueAdminPage';

export type TrueAdminFormPageClassNames = {
  root?: string;
  body?: string;
  content?: string;
  footer?: string;
  footerExtra?: string;
  footerActions?: string;
};

export type TrueAdminFormPageStyles = {
  root?: CSSProperties;
  body?: CSSProperties;
  content?: CSSProperties;
  footer?: CSSProperties;
  footerExtra?: CSSProperties;
  footerActions?: CSSProperties;
};

export type TrueAdminFormPageProps = Omit<TrueAdminPageProps, 'children'> & {
  children: ReactNode;
  classNames?: TrueAdminFormPageClassNames;
  styles?: TrueAdminFormPageStyles;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  footer?: ReactNode;
  footerExtra?: ReactNode;
  footerMode?: 'flow' | 'overlay';
};

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(Boolean).join(' ');

export function TrueAdminFormPage({
  children,
  className,
  style,
  bodyClassName,
  bodyStyle,
  classNames,
  styles,
  contentClassName,
  contentStyle,
  footer,
  footerExtra,
  footerMode = 'overlay',
  layout = 'workspace',
  contentPadding = false,
  ...pageProps
}: TrueAdminFormPageProps) {
  const hasFooter = Boolean(footer || footerExtra);

  return (
    <TrueAdminPage
      {...pageProps}
      className={joinClassNames('trueadmin-form-page', classNames?.root, className)}
      bodyClassName={joinClassNames(
        'trueadmin-form-page-body',
        hasFooter ? `is-footer-${footerMode}` : '',
        classNames?.body,
        bodyClassName,
      )}
      style={{ ...styles?.root, ...style }}
      bodyStyle={{ ...styles?.body, ...bodyStyle }}
      contentPadding={contentPadding}
      layout={layout}
    >
      <div
        className={joinClassNames(
          'trueadmin-form-page-content',
          classNames?.content,
          contentClassName,
        )}
        style={{ ...styles?.content, ...contentStyle }}
      >
        {children}
      </div>
      {hasFooter ? (
        <div
          className={joinClassNames(
            'trueadmin-form-page-footer',
            `is-${footerMode}`,
            classNames?.footer,
          )}
          style={styles?.footer}
        >
          {footerExtra ? (
            <div
              className={joinClassNames(
                'trueadmin-form-page-footer-extra',
                classNames?.footerExtra,
              )}
              style={styles?.footerExtra}
            >
              {footerExtra}
            </div>
          ) : null}
          {footer ? (
            <div
              className={joinClassNames(
                'trueadmin-form-page-footer-actions',
                classNames?.footerActions,
              )}
              style={styles?.footerActions}
            >
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </TrueAdminPage>
  );
}
