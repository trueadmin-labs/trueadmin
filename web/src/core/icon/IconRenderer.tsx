import type { ReactNode } from 'react';
import { defaultIcons } from './defaultIcons';

const registry = new Map<string, ReactNode>(Object.entries(defaultIcons));

export const registerIcons = (icons: Record<string, ReactNode>) => {
  for (const [key, icon] of Object.entries(icons)) {
    registry.set(key, icon);
  }
};

export function IconRenderer({ name }: { name?: string }) {
  if (!name) {
    return defaultIcons.fallback;
  }

  return registry.get(name) ?? defaultIcons.fallback;
}
