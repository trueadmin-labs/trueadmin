import type { CSSProperties, ReactNode } from 'react';
import type { TrueAdminTablePickerProps } from './TrueAdminTablePicker';
import { joinClassNames, toSizeValue } from './tablePickerUtils';
import './selector.css';

type TrueAdminTablePickerFrameProps<
  TRecord extends Record<string, unknown>,
  TCreate,
  TUpdate,
  TMeta,
> = Pick<
  TrueAdminTablePickerProps<TRecord, TCreate, TUpdate, TMeta>,
  'aside' | 'asideGap' | 'asideWidth' | 'className' | 'classNames' | 'style' | 'styles'
> & {
  children: ReactNode;
};

export function TrueAdminTablePickerFrame<
  TRecord extends Record<string, unknown>,
  TCreate = Partial<TRecord>,
  TUpdate = Partial<TRecord>,
  TMeta = Record<string, unknown>,
>({
  aside,
  asideGap = 0,
  asideWidth = 280,
  children,
  className,
  classNames,
  style,
  styles,
}: TrueAdminTablePickerFrameProps<TRecord, TCreate, TUpdate, TMeta>) {
  const hasAside = Boolean(aside);
  const rootStyle = {
    '--trueadmin-table-picker-aside-width': toSizeValue(asideWidth),
    '--trueadmin-table-picker-aside-gap': toSizeValue(asideGap),
    ...styles?.root,
    ...style,
  } as CSSProperties;

  return (
    <div
      className={joinClassNames(
        'trueadmin-table-picker',
        hasAside ? 'has-aside' : '',
        className,
        classNames?.root,
      )}
      style={rootStyle}
    >
      <div className={joinClassNames('trueadmin-table-picker-body', classNames?.body)}>
        {hasAside ? (
          <aside
            className={joinClassNames('trueadmin-table-picker-aside', classNames?.aside)}
            style={{ ...styles?.aside }}
          >
            {aside}
          </aside>
        ) : null}
        <main
          className={joinClassNames('trueadmin-table-picker-main', classNames?.main)}
          style={{ ...styles?.main }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
