'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import type { CurrentUser } from '@/shared';
import { setCurrentUser } from './currentUserSlice';
import { makeStore, type AppStore } from './store';

// Hydrates the Redux current-user snapshot from a value the Server Component
// root layout already fetched (via the session cookie) - the client never
// re-fetches or sees the token itself, only the resulting user object.
export function StoreProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null;
  children: React.ReactNode;
}) {
  // React 19's useRef requires an explicit initial value - see the Next
  // 14->15 upgrade notes (React 18->19).
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    // Synchronous initial hydration - avoids a flash of "logged out" UI
    // between the first render and the effect below running.
    storeRef.current.dispatch(setCurrentUser(initialUser));
  }

  // A Server Action (e.g. updating the profile name) refreshes the current
  // route, which re-runs the root layout and passes a new `initialUser`
  // here - but the store above is only created once. Without this effect,
  // the Redux snapshot (and the Navbar reading from it) would keep showing
  // the stale user until a hard reload. Re-dispatching the same value on
  // the very first run (already set synchronously above) is a harmless
  // no-op.
  useEffect(() => {
    storeRef.current?.dispatch(setCurrentUser(initialUser));
  }, [initialUser]);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
