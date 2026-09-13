'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Home,
  Check,
  Copy
} from 'lucide-react';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get('error') || 'unknown_error';
  const errorDescription = searchParams.get('error_description') || 'Terjadi kesalahan dalam permintaan otorisasi SSO.';
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const isPopup = searchParams.get('display') === 'popup' || (typeof window !== 'undefined' && !!window.opener);

  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const getErrorMeta = () => {
    switch (error) {
      case 'unauthorized_client':
        return {
          title: 'Aplikasi Tidak Terdaftar atau Tidak Aktif',
          badge: 'Aplikasi Tidak Diizinkan',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Ban,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          description:
            'Aplikasi yang mencoba menghubungkan akun Anda belum didaftarkan di sistem SSO Aruta, atau status integrasinya telah dinonaktifkan oleh Administrator.',
          advice:
            'Demi melindungi keamanan akun, SSO Aruta menolak permintaan dari aplikasi yang tidak sah. Silakan hubungi pengelola aplikasi terkait.',
        };
      case 'invalid_grant':
      case 'invalid_redirect_uri':
        return {
          title: 'Alamat Pengalihan Tidak Sah (Untrusted Callback)',
          badge: 'Keamanan URL Callback',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          description:
            'Alamat pengalihan (redirect_uri) yang dikirimkan oleh aplikasi pemohon tidak cocok dengan daftar alamat aman (whitelist) yang terdaftar di SSO Aruta.',
          advice:
            'Langkah pengamanan ini mencegah pencurian data akun oleh situs atau aplikasi tiruan yang tidak terverifikasi.',
        };
      case 'invalid_request':
        return {
          title: 'Permintaan Otorisasi Tidak Lengkap',
          badge: 'Parameter Tidak Valid',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          description:
            'Aplikasi pemohon tidak mengirimkan parameter otorisasi yang diwajibkan (seperti Client ID atau Redirect URI).',
          advice:
            'Pastikan aplikasi pemohon mengikuti panduan integrasi OAuth 2.0 yang benar sesuai spesifikasi Aruta SSO.',
        };
      case 'access_denied':
        return {
          title: 'Izin Akses Dibatalkan',
          badge: 'Dibatalkan Pengguna',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: ShieldAlert,
          iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
          description:
            'Anda telah membatalkan permintaan izin akses ke aplikasi pemohon. Tidak ada data profil atau hak akses yang diberikan.',
          advice:
            'Anda dapat menutup halaman ini atau kembali ke aplikasi pemohon jika ingin mencoba kembali sewaktu-waktu.',
        };
      case 'unsupported_response_type':
        return {
          title: 'Tipe Respons Tidak Didukung',
          badge: 'Protokol OAuth 2.0',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          description:
            'Sistem SSO Aruta hanya mendukung alur Authorization Code (response_type=code).',
          advice:
            'Periksa konfigurasi SDK atau library OAuth aplikasi Anda.',
        };
      default:
        return {
          title: 'Otorisasi SSO Tidak Dapat Diproses',
          badge: 'Kendala Autentikasi',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: ShieldAlert,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          description: errorDescription,
          advice:
            'Silakan periksa kembali konfigurasi integrasi atau coba beberapa saat lagi.',
        };
    }
  };

  const meta = getErrorMeta();
  const IconComponent = meta.icon;

  const handleCopyDiagnostics = () => {
    const text = `Aruta SSO OAuth Error:\nError: ${error}\nDescription: ${errorDescription}\nClient ID: ${clientId || 'None'}\nRedirect URI: ${redirectUri || 'None'}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (isPopup && typeof window !== 'undefined') {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'ARUTA_SSO_AUTH_ERROR',
            error,
            error_description: errorDescription,
          },
          '*'
        );
        window.opener.postMessage(
          {
            type: 'TEN_SSO_AUTH_ERROR',
            error,
            error_description: errorDescription,
          },
          '*'
        );
      }
      window.close();
    } else {
      router.push('/profile');
    }
  };

  const handleGoBack = () => {
    if (isPopup) {
      handleClose();
      return;
    }
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      if (redirectUri) {
        try {
          const u = new URL(redirectUri);
          window.location.href = u.origin;
          return;
        } catch {}
      }
      router.push('/profile');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 select-none">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Visual Icon & Badge */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border mb-3 shadow-xs ${meta.iconBg}`}>
            <IconComponent className="h-8 w-8" />
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border mb-2 ${meta.badgeColor}`}>
            {meta.badge}
          </span>

          <h1 className="text-lg font-bold text-slate-900 leading-snug">
            {meta.title}
          </h1>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs">
            {meta.description}
          </p>
        </div>

        {/* User Guidance Box */}
        <div className="my-5 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs space-y-1.5">
          <span className="font-semibold text-slate-800 block">Mengapa ini terjadi?</span>
          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            {meta.advice}
          </p>
        </div>

        {/* Developer Technical Diagnostics Accordion */}
        <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-semibold flex items-center gap-1.5">
              <span>Detail Teknis untuk Pengembang</span>
            </span>
            {showDetails ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showDetails && (
            <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2 border-t border-slate-800">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 text-[10px]">
                <span>DIAGNOSTIK SSO</span>
                <button
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Kode Kesalahan (error):</span>
                <span className="text-rose-400 font-bold">{error}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Keterangan (description):</span>
                <span className="text-slate-300 break-words">{errorDescription}</span>
              </div>

              {clientId && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Client ID:</span>
                  <span className="text-sky-300 break-all">{clientId}</span>
                </div>
              )}

              {redirectUri && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Redirect URI:</span>
                  <span className="text-amber-300 break-all">{redirectUri}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Main Action: Go Back To Previous Page */}
          <button
            type="button"
            onClick={handleGoBack}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          {isPopup ? (
            <button
              type="button"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Tutup Jendela Ini</span>
            </button>
          ) : (
            <Link
              href="/profile"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Home className="h-4 w-4 text-slate-500" />
              <span>Kembali ke Kartu Profil</span>
            </Link>
          )}

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Buka Panduan Integrasi Developer</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <OAuthErrorContent />
    </Suspense>
  );
}
