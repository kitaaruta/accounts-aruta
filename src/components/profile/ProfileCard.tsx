'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SSOUser } from '@/types/sso';
import { getUserProfile } from '@/lib/services/firestore-service';
import { 
  Shield, 
  Grid2X2, 
  LayoutDashboard, 
  Users, 
  AppWindow, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  UserCircle,
  Mail,
  Building2,
  Briefcase,
  Copy,
  Check,
  Edit3,
  ExternalLink,
  X,
  AlertTriangle,
  Search,
  AtSign,
  Share2
} from 'lucide-react';

interface ProfileCardProps {
  targetUser: SSOUser;
  currentUser: SSOUser | null;
  onLogout?: () => Promise<void>;
}

export function ProfileCard({ targetUser, currentUser, onLogout }: ProfileCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Search profile by username state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isOwner = currentUser?.uid === targetUser.uid;
  const isViewerAdmin = currentUser?.role?.toLowerCase().includes('admin');
  const isTargetAdmin = targetUser.role?.toLowerCase().includes('admin');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(targetUser.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyProfileLink = () => {
    const handle = targetUser.username || targetUser.uid;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const profileUrl = `${origin}/profile/@${handle}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setSearching(true);
    setSearchError(null);
    const clean = searchUsername.replace(/^@/, '').trim().toLowerCase();
    try {
      const found = await getUserProfile(clean);
      if (found) {
        setShowSearchModal(false);
        setSearchUsername('');
        router.push(`/profile/@${found.username || found.uid}`);
      } else {
        setSearchError(`Akun @${clean} tidak ditemukan.`);
      }
    } catch (err) {
      setSearchError('Gagal mencari profil pengguna.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmLogout = async () => {
    if (onLogout) {
      setLoggingOut(true);
      try {
        await onLogout();
        router.push('/auth/login');
      } finally {
        setLoggingOut(false);
        setShowLogoutModal(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
      {/* Context Badge */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {isOwner ? 'Profil Akun Anda' : isViewerAdmin ? 'Tampilan Administrator' : 'Profil Publik Terverifikasi'}
        </span>
        {isOwner ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
            Pemilik Akun
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            Akses Publik
          </span>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
        <div className="relative mb-3">
          {targetUser.photoURL ? (
            <img
              src={targetUser.photoURL}
              alt={targetUser.displayName}
              className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-3xl border border-blue-200 shadow-xs">
              {targetUser.displayName ? targetUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          {isTargetAdmin && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs" title="Administrator">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          )}
          {isOwner && !isTargetAdmin && (
            <Link
              href="/account"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white shadow-xs hover:bg-blue-600 transition-colors"
              title="Ubah Foto Profil di Akun"
            >
              <Edit3 className="h-3 w-3" />
            </Link>
          )}
        </div>

        <h1 className="text-lg font-bold text-slate-900">{targetUser.displayName}</h1>

        {/* Username Handle & Copy Link */}
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700 border border-slate-200">
            @{targetUser.username || targetUser.uid}
          </span>
          <button
            onClick={handleCopyProfileLink}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Salin tautan profil publik"
          >
            {copiedLink ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-1">{targetUser.email}</p>

        {/* Roles & Status */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap justify-center">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            isTargetAdmin 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Shield className="h-3 w-3" />
            <span>{targetUser.role}</span>
          </span>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            targetUser.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${targetUser.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            <span className="capitalize">{targetUser.status}</span>
          </span>
        </div>

        {/* Organization Details */}
        {(targetUser.company || targetUser.title) && (
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-600">
            {targetUser.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{targetUser.company}</span>
              </span>
            )}
            {targetUser.title && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>{targetUser.title}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Action Buttons */}
      <div className="py-6 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-2">
          {isOwner ? 'Menu Akses Akun' : isViewerAdmin ? 'Tindakan Administrator' : 'Opsi Interaksi'}
        </span>

        {/* 1. SCENARIO: OWNER VIEWING OWN PROFILE */}
        {isOwner && (
          <>
            {/* If Owner is also Admin, show single Portal Admin entry point */}
            {isViewerAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-xl bg-blue-50/80 hover:bg-blue-100/70 p-3.5 text-xs font-semibold text-blue-900 border border-blue-200/70 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Portal Admin</span>
                    <span className="text-[11px] text-blue-700 font-normal">Pusat kendali & kelola seluruh sistem SSO</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {/* Menu Detail & Edit Akun */}
            <Link
              href="/account"
              className="flex items-center justify-between rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 p-3.5 text-xs font-medium text-slate-800 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <UserCircle className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">Detail & Edit Akun</span>
                  <span className="text-[11px] text-slate-500">Lihat profil, edit detail, dan ganti kata sandi</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Menu Katalog Aplikasi */}
            <Link
              href="/apps"
              className="flex items-center justify-between rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 p-3.5 text-xs font-medium text-slate-800 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Grid2X2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">Katalog Aplikasi</span>
                  <span className="text-[11px] text-slate-500">Daftar aplikasi ekosistem yang dapat diakses</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </>
        )}

        {/* 2. SCENARIO: ADMIN VIEWING ANOTHER USER'S PROFILE */}
        {!isOwner && isViewerAdmin && (
          <>
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-xl bg-blue-50/80 hover:bg-blue-100/70 p-3 text-xs font-semibold text-blue-900 border border-blue-200/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Kelola Akun di Menu Pengguna</span>
                  <span className="text-[11px] text-blue-700 font-normal">Edit peran, suspend, atau hapus</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">UID:</span>
                <span className="font-mono text-slate-700">{targetUser.uid}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Terdaftar:</span>
                <span>{new Date(targetUser.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </>
        )}

        {/* 3. SCENARIO: GUEST VIEWING PUBLIC PROFILE */}
        {!isOwner && !isViewerAdmin && (
          <div className="space-y-2">
            <button
              onClick={handleCopyEmail}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 p-3 text-xs font-medium text-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-semibold">{copied ? 'Email Tersalin!' : 'Salin Email Kontak'}</span>
              </div>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
            </button>

            {currentUser && (
              <Link
                href="/profile"
                className="flex items-center justify-between rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 p-3 text-xs font-medium text-slate-800 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <UserCircle className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Kembali ke Profil Saya</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            )}
          </div>
        )}

        {/* Search Profile Option */}
        <button
          onClick={() => {
            setSearchError(null);
            setSearchUsername('');
            setShowSearchModal(true);
          }}
          className="w-full flex items-center justify-between rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 p-3 text-xs font-medium text-slate-700 transition-all cursor-pointer group mt-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="block font-semibold">Cari Profil Pengguna</span>
              <span className="text-[11px] text-slate-400 group-hover:text-blue-600">Temukan profil publik via @username</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Subtle, Unobtrusive Logout Action with Confirmation */}
      <div className="pt-3 border-t border-slate-100">
        {isOwner ? (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar dari akun</span>
          </button>
        ) : !currentUser ? (
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <span>Masuk ke Akun Anda</span>
          </Link>
        ) : null}
      </div>

      {/* Confirmation Modal Logout via Portal */}
      {showLogoutModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <LogOut className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari sesi akun SSO ini? Anda perlu memasukkan kata sandi kembali untuk masuk.
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

      {/* Search User by Username Modal via Portal */}
      {showSearchModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Search className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Cari Profil Publik</h3>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSearchUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masukkan Username Akun
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">@</span>
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="contoh: ahmad"
                    autoFocus
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Mencari akun terdaftar dan membuka kartu profil publiknya
                </p>
              </div>

              {searchError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={searching || !searchUsername.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{searching ? 'Mencari...' : 'Lihat Profil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
