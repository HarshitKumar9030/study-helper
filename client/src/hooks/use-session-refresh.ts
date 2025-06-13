import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export const useSessionRefresh = () => {
  const { update: updateSession } = useSession();

  const refreshSession = useCallback(async () => {
    try {
      // Get fresh user data from the database
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the session with fresh data
        await updateSession({
          user: data.user
        });
        
        return { success: true, user: data.user };
      } else {
        console.error('Failed to refresh session:', response.statusText);
        return { success: false, error: 'Failed to refresh session' };
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'Session refresh failed' };
    }
  }, [updateSession]);

  return { refreshSession };
};
