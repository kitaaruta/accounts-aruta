'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAppByClientId } from '@/lib/services/firestore-service';
import { RegisteredApp } from '@/types/sso';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  AppWindow,
  ExternalLink,
  ShieldAlert,
  Building2
} from 'lucide-react';

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile, loading: authLoading, logout } = useAuth();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'openid profile email';
  const state = searchParams.get('state') || '';

  const [app, setApp] = useState<RegisteredApp | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);

  // Check if opened as popup
  const isPopup = searchParams.get('display') === 'popup' || (typeof window !== 'undefined' && !!window.opener);

  useEffect(() => {
    async function loadApp() {
      const displayParam = searchParams.get('display') ? `&display=${searchParams.get('display')}` : '';

      if (!clientId || !redirectUri) {
        router.replace(`/oauth/error?error=invalid_request&error_description=${encodeURIComponent('Parameter client_id dan redirect_uri diperlukan.')}${displayParam}`);
        return;
      }

      try {
        const clientApp = await getAppByClientId(clientId);
        if (!clientApp || !clientApp.isActive) {
          router.replace(
            `/oauth/error?error=unauthorized_client&error_description=${encodeURIComponent('Aplikasi klien tidak terdaftar atau telah dinonaktifkan di sistem SSO Aruta.')}&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}${displayParam}`
          );
          return;
        }

        // Validate redirect URI against whitelist
        const isAllowedUri = clientApp.redirectUris.some((uri) =>
          redirectUri.startsWith(uri) || uri.startsWith(redirectUri) || redirectUri.includes('localhost')
        );

        if (!isAllowedUri) {
          router.replace(
            `/oauth/error?error=invalid_grant&error_description=${encodeURIComponent('URL pengalihan (redirect_uri) tidak sesuai dengan whitelist aplikasi terdaftar.')}&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}${displayParam}`
          );
          return;
        }

        setApp(clientApp);
      } catch (err) {
        router.replace(`/oauth/error?error=server_error&error_description=${encodeURIComponent('Gagal memverifikasi informasi aplikasi klien.')}${displayParam}`);
      } finally {
        setLoadingApp(false);
      }
    }

    loadApp();
  }, [clientId, redirectUri]);

  // If not logged in, redirect to login page with return URL
  useEffect(() => {
    if (!authLoading && !userProfile) {
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [authLoading, userProfile, router]);

  const handleApprove = async () => {
    if (!app || !userProfile || !redirectUri) return;
    setApproving(true);

    const authorizeUrl = new URL('/api/oauth/authorize', window.location.origin);
    authorizeUrl.searchParams.set('client_id', app.clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', scope);
    if (state) authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('consent_approved', 'true');
    authorizeUrl.searchParams.set('user_id', userProfile.uid);
    authorizeUrl.searchParams.set('user_email', userProfile.email);
    authorizeUrl.searchParams.set('user_name', userProfile.displayName);
    authorizeUrl.searchParams.set('user_role', userProfile.role);

    // If client explicitly requested web_message postMessage mode without redirect
    if (searchParams.get('response_mode') === 'web_message' && typeof window !== 'undefined' && window.opener) {
      try {
        authorizeUrl.searchParams.set('response_mode', 'json');
        const res = await fetch(authorizeUrl.toString(), {
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        if (data.code) {
          window.opener.postMessage(
            {
              type: 'ARUTA_SSO_AUTH_SUCCESS',
              code: data.code,
              state: data.state || state || null,
            },
            '*'
          );
          window.opener.postMessage(
            {
              type: 'TEN_SSO_AUTH_SUCCESS',
              code: data.code,
              state: data.state || state || null,
            },
            '*'
          );
          setPopupSuccess(true);
          setTimeout(() => {
            window.close();
          }, 600);
          return;
        }
      } catch (err) {
        console.error('Popup auth error:', err);
      }
    }

    // Standard OAuth 2.0 flow: navigate to authorize endpoint which redirects to client redirect_uri
    window.location.href = authorizeUrl.toString();
  };

  const handleDeny = () => {
    if (searchParams.get('response_mode') === 'web_message' && typeof window !== 'undefined' && window.opener) {
      window.opener.postMessage(
        {
          type: 'ARUTA_SSO_AUTH_ERROR',
          error: 'access_denied',
          error_description: 'Pengguna membatalkan izin otorisasi SSO',
          state: state || null,
        },
        '*'
      );
      window.opener.postMessage(
        {
          type: 'TEN_SSO_AUTH_ERROR',
          error: 'access_denied',
          error_description: 'Pengguna membatalkan izin otorisasi SSO',
          state: state || null,
        },
        '*'
      );
      window.close();
      return;
    }

    if (!redirectUri) {
      router.push('/profile');
      return;
    }

    const cancelUrl = new URL(redirectUri);
    cancelUrl.searchParams.set('error', 'access_denied');
    cancelUrl.searchParams.set('error_description', 'Pengguna membatalkan izin otorisasi SSO');
    if (state) cancelUrl.searchParams.set('state', state);

    window.location.href = cancelUrl.toString();
  };

  const handleSwitchAccount = async () => {
    const currentUrl = window.location.pathname + window.location.search;
    await logout();
    router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  if (popupSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Otorisasi Berhasil!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Menghubungkan akun ke aplikasi dan menutup jendela popup...
          </p>
        </div>
      </div>
    );
  }

  if (authLoading || loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-xs text-slate-400">Memverifikasi otorisasi SSO...</span>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 shadow-xs text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Otorisasi SSO Gagal</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push('/profile')}
              className="w-full rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Kembali ke Kartu Profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) return null;

  const scopesList = scope.split(' ').filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* App Info Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs mb-3">
            <AppWindow className="h-8 w-8" />
          </div>

          <div className="flex items-center gap-1.5 justify-center mb-1">
            <h1 className="text-lg font-bold text-slate-900">{app.name}</h1>
            <span title="Aplikasi Terverifikasi Aruta SSO">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-xs">{app.description}</p>

          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            <span>Callback:</span>
            <code className="font-mono text-slate-700">{new URL(redirectUri!).hostname}</code>
          </span>
        </div>

        {/* Current Active User Session */}
        <div className="my-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-xs">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{userProfile.displayName}</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                    @{userProfile.username || userProfile.uid}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">{userProfile.email}</span>
              </div>
            </div>

            <button
              onClick={handleSwitchAccount}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Ganti Akun
            </button>
          </div>
        </div>

        {/* Permissions / Scopes List */}
        <div className="space-y-3 pb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Izin yang Diminta Aplikasi
          </span>

          <div className="space-y-2 text-xs">
            {scopesList.includes('openid') && (
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5 bg-slate-50/40">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-semibold block">Identitas SSO Tunggal</strong>
                  <span className="text-[11px] text-slate-500">
                    Mengautentikasi dan mengenali akun Anda dengan aman.
                  </span>
                </div>
              </div>
            )}

            {scopesList.includes('profile') && (
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5 bg-slate-50/40">
                <User className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-semibold block">Informasi Profil Publik</strong>
                  <span className="text-[11px] text-slate-500">
                    Nama lengkap, username (@{userProfile.username}), peran, dan jabatan organisasi.
                  </span>
                </div>
              </div>
            )}

            {scopesList.includes('email') && (
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5 bg-slate-50/40">
                <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-semibold block">Alamat Email Terverifikasi</strong>
                  <span className="text-[11px] text-slate-500">
                    Mengakses email SSO Anda untuk komunikasi dan notifikasi.
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Kata sandi Anda tidak akan pernah dibagikan kepada aplikasi ini. Akses dapat dicabut kapan saja melalui Portal Admin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDeny}
            disabled={approving}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={approving}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer text-center"
          >
            {approving ? 'Mengizinkan...' : 'Izinkan Akses'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs text-slate-400">Memuat layar persetujuan...</span>
          </div>
        </div>
      }
    >
      <ConsentContent />
    </Suspense>
  );
}
