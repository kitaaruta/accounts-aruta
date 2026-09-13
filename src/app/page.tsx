'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RootPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (userProfile) {
        router.replace('/profile');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [userProfile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-xs font-medium text-slate-500">Memeriksa status autentikasi SSO...</span>
      </div>
    </div>
  );
}
