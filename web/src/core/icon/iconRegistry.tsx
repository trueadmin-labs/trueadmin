import * as AntIcons from '@ant-design/icons';
import type { ComponentType, ReactNode } from 'react';
import { createElement } from 'react';

export type TrueAdminIconDefinition = {
  key: string;
  label: string;
  icon: ReactNode;
  source: string;
  keywords: string[];
};

export type TrueAdminIconInput = ReactNode | string;

const registry = new Map<string, TrueAdminIconDefinition>();

export const fallbackIconKey = 'AppstoreOutlined';

const ANT_ICON_SUFFIX = /(Outlined|Filled|TwoTone)$/;

const splitIconName = (name: string) =>
  name
    .replace(/(Outlined|Filled|TwoTone)$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

const antdIconDefinitions: TrueAdminIconDefinition[] = Object.entries(AntIcons)
  .filter(([key]) => ANT_ICON_SUFFIX.test(key))
  .map(([key, Icon]) => ({
    key,
    label: key,
    icon: createElement(Icon as ComponentType),
    source: 'Ant Design Icons',
    keywords: [key.toLowerCase(), ...splitIconName(key)],
  }))
  .sort((a, b) => a.key.localeCompare(b.key));

export const isImageIconValue = (value?: string) => {
  const icon = value?.trim();
  if (!icon) {
    return false;
  }

  return (
    /^https?:\/\//i.test(icon) ||
    /^data:image\//i.test(icon) ||
    /^blob:/i.test(icon) ||
    /\.(svg|png|jpe?g|webp|gif|bmp|ico)(\?.*)?$/i.test(icon)
  );
};

export const registerIconDefinitions = (definitions: TrueAdminIconDefinition[]) => {
  for (const definition of definitions) {
    registry.set(definition.key, definition);
  }
};

export const registerIcons = (
  icons: Record<string, TrueAdminIconInput>,
  options?: { source?: string },
) => {
  const source = options?.source ?? 'Custom';
  registerIconDefinitions(
    Object.entries(icons).map(([key, icon]) => normalizeIconInput(key, icon, source)),
  );
};

function normalizeIconInput(
  key: string,
  icon: TrueAdminIconInput,
  source: string,
): TrueAdminIconDefinition {
  if (typeof icon === 'string') {
    return {
      key,
      label: key,
      icon: <img className="trueadmin-icon-image" src={icon} alt="" />,
      source,
      keywords: [key.toLowerCase(), icon.toLowerCase()],
    };
  }

  return {
    key,
    label: key,
    icon,
    source,
    keywords: [key.toLowerCase()],
  };
}

registerIconDefinitions(antdIconDefinitions);

export const getIconDefinition = (key?: string) => {
  const iconKey = key?.trim();
  if (!iconKey) {
    return undefined;
  }

  return registry.get(iconKey);
};

export const getFallbackIconDefinition = () =>
  registry.get(fallbackIconKey) ?? antdIconDefinitions[0];

export const getRegisteredIcons = () =>
  [...registry.values()].sort((a, b) =>
    [a.source, a.key].join(':').localeCompare([b.source, b.key].join(':')),
  );
