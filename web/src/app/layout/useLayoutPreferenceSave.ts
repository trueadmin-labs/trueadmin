import { useCallback, useState } from 'react';
import { authKeys } from '@/core/auth';
import { queryClient } from '@/core/query/client';
import {
  getCurrentSystemLayoutPreference,
  SYSTEM_LAYOUT_PREFERENCE_KEY,
} from '@/modules/system/profile/layoutPreference';
import { profileApi } from '@/modules/system/services/profile.api';

export function useLayoutPreferenceSave({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);

  const saveLayoutPreference = useCallback(async () => {
    setSaving(true);
    try {
      const nextProfile = await profileApi.updatePreferences({
        namespace: SYSTEM_LAYOUT_PREFERENCE_KEY,
        values: getCurrentSystemLayoutPreference(),
      });
      queryClient.setQueryData(authKeys.me, (current: unknown) =>
        current && typeof current === 'object'
          ? { ...current, preferences: nextProfile.preferences }
          : current,
      );
      onSuccess();
    } finally {
      setSaving(false);
    }
  }, [onSuccess]);

  return { saveLayoutPreference, saving };
}
