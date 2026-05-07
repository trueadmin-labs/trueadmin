import type { CSSProperties, ReactNode } from 'react';
import { TrueAdminPage, type TrueAdminPageLayout, type TrueAdminPageProps } from './TrueAdminPage';
import { TrueAdminPageSection } from './TrueAdminPageSection';

export type TrueAdminSplitPageProps = Omit<
  TrueAdminPageProps,
  'children' | 'fullHeight' | 'layout'
> & {
  left: ReactNode;
  right: ReactNode;
  leftTitle?: ReactNode;
  rightTitle?: ReactNode;
  leftExtra?: ReactNode;
  rightExtra?: ReactNode;
  leftWidth?: number | string;
  gap?: number | string;
  height?: number | string;
  layout?: Extract<TrueAdminPageLayout, 'workspace'>;
  leftClassName?: string;
  rightClassName?: string;
  leftStyle?: CSSProperties;
  rightStyle?: CSSProperties;
  splitClassName?: string;
  splitStyle?: CSSProperties;
};

const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

export function TrueAdminSplitPage({
  left,
  right,
  leftTitle,
  rightTitle,
  leftExtra,
  rightExtra,
  leftWidth = 280,
  gap = 16,
  height = '100%',
  layout = 'workspace',
  leftClassName,
  rightClassName,
  leftStyle,
  rightStyle,
  splitClassName,
  splitStyle,
  className,
  contentPadding = true,
  ...pageProps
}: TrueAdminSplitPageProps) {
  const splitClassNames = ['trueadmin-split-page', splitClassName].filter(Boolean).join(' ');
  const splitStyles = {
    '--trueadmin-split-left-width': toSizeValue(leftWidth),
    '--trueadmin-split-gap': toSizeValue(gap),
    '--trueadmin-split-height': toSizeValue(height),
    ...splitStyle,
  } as CSSProperties;

  return (
    <TrueAdminPage
      {...pageProps}
      className={['trueadmin-page-split-wrapper', className].filter(Boolean).join(' ')}
      contentPadding={contentPadding}
      layout={layout}
    >
      <div className={splitClassNames} style={splitStyles}>
        <TrueAdminPageSection
          title={leftTitle}
          extra={leftExtra}
          className={['trueadmin-split-page-left', leftClassName].filter(Boolean).join(' ')}
          bodyClassName="trueadmin-split-page-panel-body"
          style={leftStyle}
          fullHeight
          surface
        >
          {left}
        </TrueAdminPageSection>
        <TrueAdminPageSection
          title={rightTitle}
          extra={rightExtra}
          className={['trueadmin-split-page-right', rightClassName].filter(Boolean).join(' ')}
          bodyClassName="trueadmin-split-page-panel-body"
          style={rightStyle}
          fullHeight
          surface
        >
          {right}
        </TrueAdminPageSection>
      </div>
    </TrueAdminPage>
  );
}
