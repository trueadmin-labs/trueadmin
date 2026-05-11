import { useEffect } from 'react';
import { useCurrentUserQuery } from '@/core/auth';
import { applyProfilePreferences } from '@/core/profile';

export function PreferenceBootstrap() {
  const { data: currentUser } = useCurrentUserQuery();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    applyProfilePreferences(currentUser.preferences);
  }, [currentUser]);

  return null;
}
