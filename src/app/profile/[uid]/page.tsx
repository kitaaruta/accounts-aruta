'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserProfile } from '@/lib/services/firestore-service';
import { SSOUser } from '@/types/sso';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ArrowLeft, UserX } from 'lucide-react';

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUid = params?.uid as string;
  const uid = decodeURIComponent(rawUid || '');

  const { userProfile: currentUser, logout } = useAuth();
  const [targetUser, setTargetUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTarget() {
      if (!uid) return;
      try {
        setLoading(true);
        const data = await getUserProfile(uid);
        setTargetUser(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTarget();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-xs text-slate-400">Memuat profil...</span>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <UserX className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Akun dengan identitas ini tidak terdaftar di sistem SSO Aruta.
          </p>
          <div className="mt-5">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Profil Saya</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
      <ProfileCard
        targetUser={targetUser}
        currentUser={currentUser}
        onLogout={logout}
      />
    </div>
  );
}
