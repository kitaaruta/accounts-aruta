'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserPortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-xs text-slate-400">Mengalihkan ke profil...</span>
      </div>
    </div>
  );
}
