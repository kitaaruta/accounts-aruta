'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProfileCard } from '@/components/profile/ProfileCard';

export default function MyProfilePage() {
  const { userProfile, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!userProfile) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
      <ProfileCard
        targetUser={userProfile}
        currentUser={userProfile}
        onLogout={logout}
      />
    </div>
  );
}
