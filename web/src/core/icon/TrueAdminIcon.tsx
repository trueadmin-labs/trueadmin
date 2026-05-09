import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import type { TrueAdminIconInput } from './iconRegistry';
import { getFallbackIconDefinition, getIconDefinition, isImageIconValue } from './iconRegistry';

export type { TrueAdminIconInput } from './iconRegistry';
export { isImageIconValue, registerIcons } from './iconRegistry';

export type TrueAdminIconProps = {
  icon?: TrueAdminIconInput;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  imageAlt?: string;
};

const mergeClassName = (current?: unknown, next?: string) =>
  [typeof current === 'string' ? current : undefined, next].filter(Boolean).join(' ') || undefined;

const renderIconNode = (icon: ReactNode, className?: string, style?: CSSProperties) => {
  if (!icon || (!className && !style)) {
    return icon;
  }

  if (!isValidElement(icon)) {
    return icon;
  }

  const element = icon as ReactElement<{ className?: string; style?: CSSProperties }>;

  return cloneElement(element, {
    className: mergeClassName(element.props.className, className),
    style: style ? { ...element.props.style, ...style } : element.props.style,
  });
};

export function TrueAdminIcon({
  className,
  fallback,
  icon,
  imageAlt = '',
  style,
}: TrueAdminIconProps) {
  const fallbackIcon = fallback ?? getFallbackIconDefinition()?.icon ?? null;

  if (typeof icon !== 'string') {
    return renderIconNode(icon ?? fallbackIcon, className, style);
  }

  const key = icon.trim();
  if (!key) {
    return renderIconNode(fallbackIcon, className, style);
  }

  if (isImageIconValue(key)) {
    return (
      <img
        className={['trueadmin-icon-image', className].filter(Boolean).join(' ')}
        src={key}
        alt={imageAlt}
        style={style}
      />
    );
  }

  return renderIconNode(getIconDefinition(key)?.icon ?? fallbackIcon, className, style);
}
