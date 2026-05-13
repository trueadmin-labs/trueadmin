import { enabledManifests } from '@/core/module/registry';
import type { WorkbenchWidgetManifest } from '@/core/module/types';

export type RegisteredWorkbenchWidget = WorkbenchWidgetManifest & {
  source: string;
  uid: string;
};

export const workbenchWidgetManifests: RegisteredWorkbenchWidget[] = enabledManifests
  .flatMap((manifest) =>
    (manifest.workbench?.widgets ?? []).map((widget) => ({
      ...widget,
      source: manifest.id,
      uid: `${manifest.id}:${widget.key}`,
    })),
  )
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
