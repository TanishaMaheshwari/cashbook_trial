'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Scale } from 'lucide-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is still loading, don't do anything yet.
    if (isUserLoading) {
      return;
    }

    // If there's no user and we are not on the login page, redirect to login.
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }

    // If there IS a user and they are on the login page, redirect to the dashboard.
    if (user && pathname === '/login') {
        router.replace('/');
    }
  }, [user, isUserLoading, router, pathname]);
  
  // While loading, show a full-screen loader.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Scale className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in and we are on a protected route, show nothing to avoid flash of content.
  if (!user && pathname !== '/login') {
      return null;
  }
  
  // If user is logged in and on the login page, show nothing to avoid flash of content.
  if (user && pathname === '/login') {
      return null;
  }

  // Otherwise, show the content.
  return <>{children}</>;
}
