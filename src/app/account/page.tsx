'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  UserCircle, 
  Mail, 
  Lock, 
  Building2, 
  Briefcase, 
  Phone, 
  ShieldCheck, 
  Key, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Edit3,
  Clock,
  Shield,
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { userProfile, loading, updateProfileData, changePassword, forgotPassword } = useAuth();

  // Tab State: 'details' | 'security' | 'sessions'
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'sessions'>('details');
  const [isEditing, setIsEditing] = useState(false);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Statuses
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setCompany(userProfile.company || '');
      setTitle(userProfile.title || '');
      setPhoneNumber(userProfile.phoneNumber || '');
    }
  }, [userProfile]);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError(null);
      await updateProfileData({
        displayName,
        company,
        title,
        phoneNumber,
      });
      setProfileSuccess(true);
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      setProfileError(errorMessage);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordError('Harap masukkan kata sandi baru.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);
      await changePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengubah kata sandi.';
      setPasswordError(errorMessage);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSendResetLink = async () => {
    if (userProfile.email) {
      await forgotPassword(userProfile.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top Action / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Kartu Profil</span>
          </Link>

          <span className="text-[11px] font-mono text-slate-400">
            UID: {userProfile.uid.substring(0, 14)}...
          </span>
        </div>

        {/* Clean Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl border border-blue-200 shadow-xs">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">{userProfile.displayName}</h1>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                  {userProfile.role}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-semibold text-blue-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  @{userProfile.username || userProfile.uid}
                </span>
                <span className="text-xs text-slate-500">{userProfile.email}</span>
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-medium">Status</span>
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-600 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>{userProfile.status === 'active' ? 'Aktif' : 'Ditangguhkan'}</span>
            </div>
          </div>
        </div>

        {/* 3 Tabs Container */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-blue-600 bg-white text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCircle className="h-4 w-4" />
              <span>Detail Akun</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'border-blue-600 bg-white text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Keamanan</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-blue-600 bg-white text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Sesi & Akses</span>
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: DETAIL AKUN & EDIT DETAIL AKUN */}
            {activeTab === 'details' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Detail Informasi Akun</h2>
                    <p className="text-[11px] text-slate-500">
                      Informasi profil identitas Anda yang terhubung dengan SSO
                    </p>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Detail Akun</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>Batal Edit</span>
                    </button>
                  )}
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Detail akun berhasil disimpan.</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
                        required
                        className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          !isEditing ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Username (@handle)
                        </label>
                        <span className="text-[10px] text-amber-600 font-medium">Permanen (tidak dapat diubah)</span>
                      </div>
                      <input
                        type="text"
                        value={`@${userProfile.username || userProfile.uid}`}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-xs text-slate-600 cursor-not-allowed font-mono font-medium"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Digunakan untuk tautan profil publik:{' '}
                        <span className="text-blue-600 font-mono">/profile/@{userProfile.username || userProfile.uid}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email SSO (Identitas Utama)
                      </label>
                      <input
                        type="email"
                        value={userProfile.email}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-xs text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Organisasi / Lembaga
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g. Komunitas Arut Utara"
                        className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          !isEditing ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Jabatan / Posisi
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g. Contributor"
                        className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          !isEditing ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!isEditing}
                        placeholder="+62 812-xxxx-xxxx"
                        className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                          !isEditing ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Peran Akun
                      </label>
                      <input
                        type="text"
                        value={userProfile.role}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-xs text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{profileSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB 2: KEAMANAN & GANTI PASSWORD */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Keamanan Akun & Kata Sandi</h2>
                  <p className="text-[11px] text-slate-500">
                    Perbarui kata sandi atau kirim tautan reset ke alamat email akun
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Kata sandi berhasil diperbarui!</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {resetEmailSent && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Tautan instruksi reset kata sandi telah dikirim ke {userProfile.email}.</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Form Ganti Password Langsung */}
                  <form onSubmit={handleChangePassword} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <span className="text-xs font-bold text-slate-900 block">Ganti Kata Sandi</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kata Sandi Baru
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Konfirmasi Kata Sandi Baru
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi"
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>{passwordSaving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Reset Password Via Email */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Kirim Tautan Reset ke Email</span>
                      <span className="text-[11px] text-slate-500">
                        Kirim link ke {userProfile.email} untuk mereset kata sandi via Firebase Auth
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                      <span>Kirim Tautan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SESI & AKSES APLIKASI */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Sesi & Akses SSO</h2>
                  <p className="text-[11px] text-slate-500">
                    Status autentikasi aktif dan akses ke ekosistem aplikasi Aruta.id
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 border border-slate-200">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Sesi Browser Saat Ini</span>
                      <span className="text-[11px] text-slate-500">
                        Login terakhir: {userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt).toLocaleString('id-ID') : 'Hari ini'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs text-slate-600">Katalog Aplikasi SSO</span>
                    <Link
                      href="/apps"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <span>Buka Katalog Aplikasi</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
