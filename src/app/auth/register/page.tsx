'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { resolveOAuthRedirect, buildAuthLink } from '@/lib/auth/oauth-flow';
import { isUsernameAvailable, getAppByClientId } from '@/lib/services/firestore-service';
import { RegisteredApp } from '@/types/sso';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  AtSign, 
  Loader2, 
  Check, 
  XCircle,
  AppWindow
} from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { uploadProfilePhoto } from '@/lib/services/storage-service';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [targetApp, setTargetApp] = useState<RegisteredApp | null>(null);

  const redirectInfo = resolveOAuthRedirect(searchParams);

  useEffect(() => {
    if (redirectInfo.clientId) {
      getAppByClientId(redirectInfo.clientId)
        .then((app) => setTargetApp(app))
        .catch(() => setTargetApp(null));
    }
  }, [redirectInfo.clientId]);

  // Debounced real-time username availability check
  useEffect(() => {
    const clean = username.replace(/^@/, '').toLowerCase().trim();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Minimal 3 karakter.');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Hanya huruf kecil, angka, dan underscore (_).');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Memeriksa ketersediaan...');

    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(clean);
        if (available) {
          setUsernameStatus('available');
          setUsernameMessage(`Username @${clean} tersedia!`);
        } else {
          setUsernameStatus('taken');
          setUsernameMessage(`Username @${clean} sudah digunakan. Silakan pilih yang lain.`);
        }
      } catch (err) {
        setUsernameStatus('idle');
        setUsernameMessage('');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setError('Harap lengkapi semua bidang.');
      return;
    }

    const cleanUser = username.replace(/^@/, '').toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUser)) {
      setError('Username hanya boleh berupa 3-20 karakter huruf kecil, angka, atau underscore (_).');
      return;
    }

    if (usernameStatus === 'taken') {
      setError(`Username @${cleanUser} sudah digunakan. Silakan pilih username lain.`);
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check username uniqueness
      const available = await isUsernameAvailable(cleanUser);
      if (!available) {
        setUsernameStatus('taken');
        setUsernameMessage(`Username @${cleanUser} sudah digunakan.`);
        setError(`Username @${cleanUser} sudah digunakan. Silakan pilih username lain.`);
        setLoading(false);
        return;
      }

      let uploadedPhotoURL: string | undefined = undefined;
      if (avatarFile) {
        try {
          uploadedPhotoURL = await uploadProfilePhoto(avatarFile, cleanUser);
        } catch (photoErr) {
          console.warn('Photo upload fallback to preview:', photoErr);
          uploadedPhotoURL = avatarPreview || undefined;
        }
      }

      await register(email, password, fullName, cleanUser, uploadedPhotoURL);
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectInfo.targetUrl);
      }, 1000);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Pendaftaran gagal. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Akun SSO Aruta</h1>
          <p className="mt-1 text-xs text-slate-500">
            Daftarkan identitas tunggal Anda untuk mengakses seluruh ekosistem aplikasi Aruta.id
          </p>
        </div>

        {/* SSO Target Application Alert Banner if during SSO */}
        {redirectInfo.isSSOFlow && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0 shadow-xs">
              <AppWindow className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {targetApp?.name || redirectInfo.clientId || 'Aplikasi Mitra'}
                </p>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">SSO</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Setelah mendaftar, Anda akan otomatis diarahkan ke persetujuan otorisasi
              </p>
            </div>
          </div>
        )}

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Registrasi Akun Baru</h2>
            <p className="text-xs text-slate-500 mt-0.5">Username bersifat permanen dan menjadi tautan profil publik Anda</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {redirectInfo.isSSOFlow
                  ? 'Pendaftaran berhasil! Mengalihkan ke persetujuan SSO...'
                  : 'Pendaftaran berhasil! Mengalihkan ke profil Anda...'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Foto Profil */}
            <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100">
              <AvatarUpload
                currentPhotoURL={avatarPreview}
                displayName={fullName || 'U'}
                size="md"
                onFileSelected={(file, previewUrl) => {
                  setAvatarFile(file);
                  setAvatarPreview(previewUrl);
                }}
                onPhotoRemoved={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                disabled={loading || success}
              />
              <span className="text-[11px] text-slate-400 font-medium mt-1">
                Foto Profil (Opsional)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ahmad Fadil"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Username (Permanen)
                </label>
                <span className="text-[10px] text-slate-400">Tidak dapat diubah</span>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ahmad_aruta"
                  required
                  className={`w-full rounded-lg border py-2 pl-9 pr-9 text-xs font-mono text-slate-800 placeholder:text-slate-400 transition-all ${
                    usernameStatus === 'available'
                      ? 'border-emerald-300 bg-emerald-50/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : usernameStatus === 'taken'
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : usernameStatus === 'invalid'
                      ? 'border-amber-300 bg-amber-50/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                <div className="absolute right-3 top-2.5 flex items-center">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {usernameStatus === 'taken' && (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  {usernameStatus === 'invalid' && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Status Message */}
              {usernameStatus === 'available' && (
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 mt-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{usernameMessage}</span>
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1.5 mt-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{usernameMessage}</span>
                </p>
              )}
              {usernameStatus === 'invalid' && (
                <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{usernameMessage}</span>
                </p>
              )}
              {usernameStatus === 'checking' && (
                <p className="text-[11px] font-medium text-blue-600 flex items-center gap-1.5 mt-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>{usernameMessage}</span>
                </p>
              )}

              <span className="text-[10px] text-slate-400 mt-1 block">
                Tautan publik: <strong className="text-slate-600 font-mono">aruta.id/profile/@{username || 'username'}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@aruta.id"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Daftarkan Akun SSO</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login redirect link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Sudah punya akun SSO?{' '}
          <Link href={buildAuthLink('/auth/login', searchParams)} className="font-semibold text-blue-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Memuat...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
