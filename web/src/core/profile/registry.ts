import { enabledManifests } from '@/core/module/registry';
import type { ProfilePreferenceManifest } from '@/core/module/types';

export const profilePreferenceManifests: ProfilePreferenceManifest[] = enabledManifests
  .flatMap((manifest) => manifest.profile?.preferences ?? [])
  .sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));

const toPreferencesRecord = (preferences: unknown): Record<string, unknown> =>
  preferences && typeof preferences === 'object' && !Array.isArray(preferences)
    ? (preferences as Record<string, unknown>)
    : {};

export const applyProfilePreferences = (preferences: unknown) => {
  const preferenceRecord = toPreferencesRecord(preferences);

  profilePreferenceManifests.forEach((manifest) => {
    manifest.apply?.({
      namespace: manifest.key,
      value: preferenceRecord[manifest.key],
      preferences: preferenceRecord,
    });
  });
};
