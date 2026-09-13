'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  LogOut, 
  User, 
  Settings, 
  LayoutGrid, 
  Building2,
  ExternalLink 
} from 'lucide-react';

export function AppNavbar() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/auth/login');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const isAdmin = userProfile?.role?.toLowerCase().includes('admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">Aruta SSO</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                  Portal Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Single Source of Truth Identity</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-semibold text-slate-800">{userProfile.displayName}</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                    @{userProfile.username || userProfile.uid}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{userProfile.email}</span>
              </div>

              <div className="relative flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  title="Kartu Profil"
                >
                  <User className="h-4 w-4" />
                </Link>

                {/* Subtle, unobtrusive logout button */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Keluar dari Portal Admin"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Logout rendered via Portal to document.body */}
      {showLogoutModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <LogOut className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari sesi Portal Admin SSO? Anda perlu memasukkan kata sandi kembali untuk masuk.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {loggingOut ? 'Memproses...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
