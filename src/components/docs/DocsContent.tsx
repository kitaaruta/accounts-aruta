'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Code2, 
  Key, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  ExternalLink,
  Play,
  Sparkles,
  ArrowRight,
  Server,
  AppWindow,
  RefreshCw,
  Globe,
  Package,
  FileCode2,
  Lock,
  Compass,
  Bot,
  Wand2,
  Cpu
} from 'lucide-react';
import ArutaLoginButton from '@/components/sdk/ArutaLoginButton';

interface CodeSnippet {
  language: string;
  filename: string;
  code: string;
}

export function DocsContent({ inAdmin = false }: { inAdmin?: boolean }) {
  const [mainTab, setMainTab] = useState<'endpoints' | 'sdk' | 'oidc' | 'uikit' | 'ai-prompts'>('endpoints');
  const [activeCodeLang, setActiveCodeLang] = useState<'nodejs' | 'php' | 'python' | 'curl'>('nodejs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Prompt Kit State
  const [aiAppName, setAiAppName] = useState('Portal Aplikasi Saya');
  const [aiClientId, setAiClientId] = useState('aruta_app_882910394b');
  const [aiClientSecret, setAiClientSecret] = useState('ARUTA_CLIENT_SECRET_PLACEHOLDER');
  const [aiRedirectUri, setAiRedirectUri] = useState('http://localhost:3000/api/auth/callback/aruta');
  const [aiFramework, setAiFramework] = useState<'master' | 'nextjs' | 'react-express' | 'laravel' | 'fastapi'>('master');
  const [aiLoginMode, setAiLoginMode] = useState<'popup' | 'redirect'>('popup');

  // Playground simulation state
  const [simClientId, setSimClientId] = useState('aruta_app_882910394b');
  const [simClientSecret, setSimClientSecret] = useState('sec_live_99aa88bb77cc66dd55ee44ff');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<{
    tokenResponse?: Record<string, unknown>;
    userinfoResponse?: Record<string, unknown>;
  } | null>(null);

  // UI Kit interactive state
  const [uiVariant, setUiVariant] = useState<'primary' | 'dark' | 'light'>('primary');
  const [uiSize, setUiSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [uiMode, setUiMode] = useState<'redirect' | 'popup'>('popup');
  const [uiLoading, setUiLoading] = useState(false);
  const [popupAuthResult, setPopupAuthResult] = useState<{ code: string; state?: string } | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runSimulation = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      // 1. Request test token exchange
      const res = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: 'sso_code_simulation_' + Math.random().toString(36).substring(2, 8),
          client_id: simClientId,
          client_secret: simClientSecret,
          redirect_uri: 'https://finance.aruta.id/oauth/callback',
        }),
      });

      const tokenData = await res.json();
      let userinfoData = null;

      // 2. If token acquired, fetch userinfo
      if (tokenData?.access_token) {
        const userinfoRes = await fetch('/api/oauth/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        userinfoData = await userinfoRes.json();
      }

      setSimResult({
        tokenResponse: tokenData,
        userinfoResponse: userinfoData,
      });
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const codeSnippets: Record<string, CodeSnippet> = {
    nodejs: {
      language: 'javascript',
      filename: 'oauth-client.js (Node.js / Next.js)',
      code: `// 1. URL untuk mengarahkan pengguna login ke Aruta SSO
const SSO_AUTHORIZE_URL = 'http://localhost:3000/api/oauth/authorize';
const CLIENT_ID = '${simClientId}';
const REDIRECT_URI = 'https://myapp.aruta.id/api/callback';

export function redirectToSSO() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state: 'random_csrf_state_token'
  });
  window.location.href = \`\${SSO_AUTHORIZE_URL}?\${params.toString()}\`;
}

// 2. Endpoint Callback di server backend aplikasi Anda
export async function handleSSOCallback(authCode) {
  // Tukar Authorization Code dengan Access Token
  const tokenRes = await fetch('http://localhost:3000/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: CLIENT_ID,
      client_secret: '${simClientSecret}',
      redirect_uri: REDIRECT_URI
    })
  });
  const { access_token } = await tokenRes.json();

  // Ambil profil pengguna lengkap (termasuk @username & role)
  const userRes = await fetch('http://localhost:3000/api/oauth/userinfo', {
    headers: { Authorization: \`Bearer \${access_token}\` }
  });
  const userProfile = await userRes.json();

  console.log('Login Berhasil:', userProfile.username, userProfile.email);
  return userProfile;
}`
    },
    php: {
      language: 'php',
      filename: 'sso_auth.php (PHP / Laravel)',
      code: `<?php
// 1. Arahkan pengguna ke Aruta SSO
$clientId = '${simClientId}';
$redirectUri = 'https://myapp.aruta.id/callback.php';
$state = bin2hex(random_bytes(16));

$authorizeUrl = "http://localhost:3000/api/oauth/authorize?" . http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'openid profile email',
    'state' => $state
]);

// 2. Pada callback.php: Tukar code dengan token
$code = $_GET['code'] ?? null;

$ch = curl_init('http://localhost:3000/api/oauth/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'grant_type' => 'authorization_code',
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => '${simClientSecret}',
    'redirect_uri' => $redirectUri
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$tokenResponse = json_decode(curl_exec($ch), true);
curl_close($ch);

// 3. Tarik Profil Pengguna
$accessToken = $tokenResponse['access_token'];
$ch = curl_init('http://localhost:3000/api/oauth/userinfo');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$accessToken}"]);
$user = json_decode(curl_exec($ch), true);
curl_close($ch);

echo "Halo " . htmlspecialchars($user['name']) . " (@" . htmlspecialchars($user['username']) . ")";
?>`
    },
    python: {
      language: 'python',
      filename: 'sso_auth.py (Python / FastAPI / Django)',
      code: `import requests

CLIENT_ID = "${simClientId}"
CLIENT_SECRET = "${simClientSecret}"
REDIRECT_URI = "https://myapp.aruta.id/callback"
BASE_URL = "http://localhost:3000"

# 1. Generate Auth URL
def get_auth_url():
    return f"{BASE_URL}/api/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=openid+profile+email"

# 2. Tukar Code dan Ambil User
def authenticate_user(code: str):
    token_resp = requests.post(
        f"{BASE_URL}/api/oauth/token",
        json={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI
        }
    ).json()

    access_token = token_resp.get("access_token")
    user_info = requests.get(
        f"{BASE_URL}/api/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    return user_info`
    },
    curl: {
      language: 'bash',
      filename: 'curl-example.sh (Terminal CLI)',
      code: `# 1. Tukar Kode Otorisasi menjadi Token
curl -X POST http://localhost:3000/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_FROM_CALLBACK",
    "client_id": "${simClientId}",
    "client_secret": "${simClientSecret}",
    "redirect_uri": "https://myapp.aruta.id/callback"
  }'

# Respons:
# { "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "Bearer" }

# 2. Ambil data profil pengguna
curl -X GET http://localhost:3000/api/oauth/userinfo \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Cabut Token (Revoke Session)
curl -X POST http://localhost:3000/api/oauth/revoke \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_ACCESS_TOKEN",
    "client_id": "${simClientId}",
    "client_secret": "${simClientSecret}"
  }'`
    }
  };

  const sdkTsCode = `/**
 * Aruta SSO Official Client SDK
 * Universal TypeScript/JavaScript helper library for connecting to Aruta Single Sign-On.
 */
import { ArutaAuthClient } from '@/lib/sdk/aruta-auth-client';

export const tenAuth = new ArutaAuthClient({
  clientId: process.env.TEN_CLIENT_ID || '${simClientId}',
  clientSecret: process.env.TEN_CLIENT_SECRET || '${simClientSecret}',
  redirectUri: process.env.TEN_REDIRECT_URI || 'https://myapp.aruta.id/callback',
  baseUrl: process.env.TEN_SSO_URL || 'https://accounts.aruta.id',
});

// Contoh 1: Dapatkan URL Login
export function login() {
  window.location.href = tenAuth.getLoginUrl();
}

// Contoh 2: Tukar Kode & Dapatkan Profil dalam 1 Baris (Server-side)
export async function handleCallback(code: string) {
  const { user, token } = await tenAuth.handleCallback(code);
  console.log('Pengguna terverifikasi:', user.name, user.username, user.email);
  return user;
}

// Contoh 3: Logout / Cabut Token (RFC 7009)
export async function logout(token: string) {
  return await tenAuth.revokeToken(token);
}`;

  const nextAuthConfig = `// app/api/auth/[...nextauth]/route.ts (NextAuth.js / Auth.js)
import NextAuth from "next-auth";

export const authOptions = {
  providers: [
    {
      id: "aruta-sso",
      name: "Akun Aruta",
      type: "oauth",
      // Menggunakan OIDC Discovery otomatis:
      wellKnown: "https://accounts.aruta.id/.well-known/openid-configuration",
      clientId: process.env.TEN_CLIENT_ID,
      clientSecret: process.env.TEN_CLIENT_SECRET,
      authorization: { params: { scope: "openid profile email" } },
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          username: profile.username,
          image: profile.avatar || profile.picture,
          role: profile.role,
        };
      },
    },
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };`;

  const generateAiPrompt = () => {
    const isPopup = aiLoginMode === 'popup';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://accounts.aruta.id';

    const architectureKnowledgeBlock = `### 🧠 KONTEKS ARSITEKTUR PLATFORM ARUTA SSO:
- Platform ini adalah "Aruta Single Sign-On (SSO)" (${baseUrl}), yaitu pusat identitas tunggal (Single Source of Truth) untuk seluruh ekosistem digital Aruta.id (portal utama, riset, pustaka, bahasa daerah, GIS geospasial, ruang komunitas) serta aplikasi mitra pihak ketiga.
- Peran Aplikasi Ini: Bertindak sebagai Relying Party (Client App) OAuth 2.0 / OpenID Connect (OIDC). Aplikasi ini TIDAK BOLEH mengelola kata sandi pengguna secara independen, melainkan mendelegasikan seluruh autentikasi ke Aruta SSO.
- Endpoint Spesifikasi OIDC & AI Knowledge:
  * OIDC Discovery: ${baseUrl}/.well-known/openid-configuration
  * JWKS Public Keys: ${baseUrl}/.well-known/jwks.json
  * AI Knowledge Base (LLMs.txt): ${baseUrl}/llms.txt
- Skema Data Profil Pengguna (Userinfo Payload):
  * sub: string (Unique User Identifier permanen di Aruta SSO)
  * name: string (Nama Lengkap pengguna)
  * username: string (Handle identitas unik pengguna, contoh: "ahmad_aruta")
  * email: string (Alamat email terverifikasi pengguna)
  * picture / avatar: string (URL foto profil pengguna)
  * role: string ("Superadmin" | "Admin" | "Member" | peran khusus)
  * status: "active" | "suspended" (WAJIB diperiksa: tolak login jika status bukan "active")
  * company: string | undefined (Organisasi / Instansi)
  * title: string | undefined (Jabatan / Posisi)`;

    if (aiFramework === 'master') {
      return `Tolong buatkan integrasi autentikasi Single Sign-On (SSO) dari platform "Aruta SSO" ke dalam proyek aplikasi ini secara lengkap, aman, dan siap produksi (production-ready).

${architectureKnowledgeBlock}

### 🔑 KREDENSIAL APLIKASI SAYA:
- Nama Aplikasi Klien: ${aiAppName}
- Client ID: ${aiClientId}
- Client Secret (Environment Variable): Simpan rahasia ini HANYA di file .env backend (misal ARUTA_CLIENT_SECRET="${aiClientSecret}"). JANGAN PERNAH diekspos ke browser / frontend bundle.
- Redirect URI / Callback URL: ${aiRedirectUri}
- Base URL SSO Aruta: ${baseUrl}
- Mode Login Terpilih: ${isPopup ? 'Mode Popup Window (seperti Sign-in with Google: menggunakan window.open, postMessage untuk mengirim authorization code ke window opener, dan otomatis window.close())' : 'Mode Full Page Redirect standar OAuth 2.0'}

### 🛡️ ATURAN KEAMANAN WAJIB:
- Client Secret WAJIB diproses di sisi Server (Backend / Route Handler / Server Action). Jangan letakkan di kode client/browser.
- Buat file .env.example dan sertakan panduan penempatan ARUTA_CLIENT_SECRET.

### 📋 TUGAS IMPLEMENTASI:
1. Buat helper/service autentikasi SSO Aruta yang mengelola pembuatan Authorization URL (sertakan state CSRF token), penukaran code ke access token via POST ${baseUrl}/api/oauth/token, dan pengambilan profil via GET ${baseUrl}/api/oauth/userinfo.
2. Buat komponen tombol login resmi "Masuk dengan Akun Aruta" (dengan logo perisai Aruta, state loading interaktif, dan penanganan ${isPopup ? 'popup window.open' : 'redirect'}).
3. Tangani callback OAuth:
   * Validasi parameter state untuk mencegah CSRF.
   * Ambil token dan userinfo.
   * Validasi status keaktifan: jika user.status !== 'active', tolak akses dan tampilkan pesan "Akun Anda sedang ditangguhkan oleh Administrator Aruta SSO".
   * Simpan atau sinkronisasikan profil pengguna (sub, name, username, email, picture, role) ke session lokal / database aplikasi ini.
4. Buat session management yang aman (HttpOnly Cookie atau signed JWT session).
5. Buat route guard / middleware proteksi rute halaman yang membutuhkan otentikasi.
6. Buat fitur logout yang memanggil endpoint pencabutan token (POST ${baseUrl}/api/oauth/revoke) lalu membersihkan sesi lokal.

Tuliskan kode yang bersih, modular, tangguh terhadap error jaringan, dan sertakan instruksi file .env serta panduan pengujian integrasi.`;
    }

    if (aiFramework === 'nextjs') {
      return `Saya sedang membangun aplikasi Next.js (App Router). Tolong buatkan integrasi autentikasi SSO Aruta yang production-ready:

${architectureKnowledgeBlock}

Konfigurasi Aplikasi:
- Client ID: ${aiClientId}
- Client Secret (Environment Variable): Simpan di .env.local sebagai ARUTA_CLIENT_SECRET="${aiClientSecret}". JANGAN PERNAH diekspos dengan prefix NEXT_PUBLIC_.
- Redirect URI: ${aiRedirectUri}
- Base URL SSO: ${baseUrl}
- Mode Login: ${isPopup ? 'Popup Window (window.open + postMessage listener)' : 'Full Page Redirect'}

Kebutuhan Implementasi:
1. Konfigurasikan OAuth2/OIDC provider Aruta SSO (menggunakan Auth.js / NextAuth atau custom Server Actions & Route Handler app/api/auth/callback/route.ts).
2. Petakan seluruh user claim ke dalam session: sub/id, name, username, email, picture, role, dan status. Pastikan jika status !== 'active', sesi dibatalkan.
3. Buat komponen UI tombol login "${isPopup ? 'Masuk via Popup Aruta' : 'Masuk dengan Akun Aruta'}" dengan visual minimalis elegan.
4. Buat proxy/middleware (middleware.ts) untuk memproteksi route privat (misal /dashboard).
5. Buat route handler /api/auth/logout untuk memanggil revoke token ke ${baseUrl}/api/oauth/revoke dan menghapus session cookie.
6. Berikan template file .env.local yang siap pakai.`;
    }

    if (aiFramework === 'react-express') {
      return `Tolong buatkan sistem autentikasi SSO Aruta untuk fullstack app: Frontend React (Vite/Tailwind) + Backend Node.js (Express):

${architectureKnowledgeBlock}

Konfigurasi SSO:
- Client ID: ${aiClientId}
- Client Secret (Backend Only): Simpan di .env backend sebagai ARUTA_CLIENT_SECRET="${aiClientSecret}". Jangan pernah diekspos ke frontend React!
- Redirect URI: ${aiRedirectUri}
- Base URL SSO: ${baseUrl}
- Mode: ${isPopup ? 'Popup Window (window.open + postMessage)' : 'Full Redirect'}

Kebutuhan:
1. Di Frontend React: Buat komponen tombol login Aruta dan listener callback ${isPopup ? '(menangkap postMessage code dari popup)' : '(route /callback)'}.
2. Di Backend Express: Buat endpoint POST /api/auth/callback untuk menukar code ke access token, mengambil profil userinfo, dan memastikan user.status === 'active'.
3. Simpan sesi pengguna ke dalam secure HttpOnly cookie.
4. Buat Express Auth Middleware untuk melindungi API endpoints.
5. Buat endpoint logout yang memanggil ${baseUrl}/api/oauth/revoke.`;
    }

    if (aiFramework === 'laravel') {
      return `Tolong buatkan controller, route, dan session handler integrasi SSO Aruta untuk PHP Laravel:

${architectureKnowledgeBlock}

Konfigurasi SSO:
- Client ID: ${aiClientId}
- Client Secret (.env): Simpan di .env sebagai ARUTA_CLIENT_SECRET="${aiClientSecret}" dan akses via config('services.aruta.client_secret').
- Redirect URI: ${aiRedirectUri}
- Base URL SSO: ${baseUrl}

Kebutuhan:
1. Buat ArutaSSOController dengan method redirectToSSO() dan handleCallback(Request $request).
2. Validasi CSRF state parameter.
3. Tukar code menjadi token dengan Http::asJson()->post('${baseUrl}/api/oauth/token').
4. Ambil profil userinfo dari '${baseUrl}/api/oauth/userinfo'.
5. Validasi: jika status !== 'active', redirect kembali ke login dengan error 'Akun ditangguhkan'.
6. UpdateOrCreate data pengguna di tabel users lokal (sertakan sub, name, username, email, picture, role) lalu jalankan Auth::login($user).
7. Buat method logout() yang memanggil '${baseUrl}/api/oauth/revoke'.`;
    }

    return `Tolong buatkan integrasi autentikasi SSO Aruta untuk backend Python (FastAPI):

${architectureKnowledgeBlock}

Konfigurasi SSO:
- Client ID: ${aiClientId}
- Client Secret (.env): Simpan di .env sebagai ARUTA_CLIENT_SECRET="${aiClientSecret}"
- Redirect URI: ${aiRedirectUri}
- Base URL SSO: ${baseUrl}

Kebutuhan:
1. Endpoint GET /login: menghasilkan URL otorisasi SSO Aruta dengan state CSRF token.
2. Endpoint GET /auth/callback: menerima code dan state, memanggil POST ${baseUrl}/api/oauth/token menggunakan httpx, lalu memanggil GET ${baseUrl}/api/oauth/userinfo.
3. Periksa status keaktifan user (status == 'active').
4. Buat JWT session cookie atau token session untuk user.
5. Buat dependency FastAPI get_current_user untuk proteksi endpoint.
6. Endpoint POST /logout: memanggil revoke token ke Aruta SSO dan menghapus session cookie.`;
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100 mb-3">
              <Code2 className="h-3.5 w-3.5" />
              <span>OAuth 2.0 & OpenID Connect (OIDC) Standard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pusat Integrasi Developer & SSO API Kit
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              Dokumentasi teknis standar industri untuk menghubungkan aplikasi eksternal, portal internal, 
              serta microservices ke Single Sign-On (SSO) Aruta.id.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/apps"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <AppWindow className="h-4 w-4" />
              <span>Daftarkan Aplikasi Baru</span>
            </Link>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setMainTab('endpoints')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mainTab === 'endpoints'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Spesifikasi REST API & Playground</span>
          </button>

          <button
            onClick={() => setMainTab('sdk')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mainTab === 'sdk'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Official Client SDK (TypeScript)</span>
          </button>

          <button
            onClick={() => setMainTab('oidc')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mainTab === 'oidc'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>OIDC Discovery & NextAuth</span>
          </button>

          <button
            onClick={() => setMainTab('uikit')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mainTab === 'uikit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Official Button UI Kit</span>
          </button>

          <button
            onClick={() => setMainTab('ai-prompts')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mainTab === 'ai-prompts'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Bot className="h-4 w-4 text-purple-600" />
            <span>Prompt AI Agent & Vibe Coding</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REST API & PLAYGROUND */}
      {mainTab === 'endpoints' && (
        <div className="space-y-8">
          {/* 3 Step Workflow Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Dapatkan Kredensial</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Daftarkan aplikasi Anda di menu <strong className="text-slate-800">Aplikasi Terdaftar</strong> untuk mendapatkan <code className="font-mono text-blue-600">Client ID</code>, <code className="font-mono text-blue-600">Client Secret</code>, dan mengatur whitelist Redirect URI.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Arahkan ke Layar Izin</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Buka endpoint <code className="font-mono text-blue-600">/api/oauth/authorize</code>. Pengguna akan login dan menyetujui izin pada <strong className="text-slate-800">Consent Screen</strong>, lalu kembali membawa <code className="font-mono text-blue-600">code</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Tukar Token & Ambil Profil</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Server backend Anda memanggil <code className="font-mono text-blue-600">/api/oauth/token</code> untuk menukar code dengan JWT token, lalu mengambil data identitas via <code className="font-mono text-blue-600">/api/oauth/userinfo</code>.
              </p>
            </div>
          </div>

          {/* API Endpoints Reference Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Referensi Endpoint SSO Aruta</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar endpoint standar OAuth 2.0 & RFC yang dapat diakses oleh aplikasi Anda</p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Endpoint 1: Authorize */}
              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 font-mono">
                    GET
                  </span>
                  <code className="font-mono font-semibold text-slate-900">/api/oauth/authorize</code>
                  <span className="text-slate-400 text-[11px]">- Endpoint Otorisasi Pengguna & Consent Screen</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Parameter wajib: <code className="font-mono text-blue-600">client_id</code>, <code className="font-mono text-blue-600">redirect_uri</code>, <code className="font-mono text-blue-600">response_type=code</code>, <code className="font-mono text-blue-600">scope=openid profile email</code>, <code className="font-mono text-blue-600">state</code>.
                </p>
              </div>

              {/* Endpoint 2: Token */}
              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 font-mono">
                    POST
                  </span>
                  <code className="font-mono font-semibold text-slate-900">/api/oauth/token</code>
                  <span className="text-slate-400 text-[11px]">- Endpoint Penukaran Kode Otorisasi ke JWT Access Token</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Parameter body (JSON atau form-urlencoded): <code className="font-mono text-blue-600">grant_type=authorization_code</code>, <code className="font-mono text-blue-600">client_id</code>, <code className="font-mono text-blue-600">client_secret</code>, <code className="font-mono text-blue-600">code</code>, <code className="font-mono text-blue-600">redirect_uri</code>.
                </p>
              </div>

              {/* Endpoint 3: Userinfo */}
              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 font-mono">
                    GET
                  </span>
                  <code className="font-mono font-semibold text-slate-900">/api/oauth/userinfo</code>
                  <span className="text-slate-400 text-[11px]">- Endpoint Data Profil Pengguna Terotentikasi</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Header wajib: <code className="font-mono text-blue-600">Authorization: Bearer &lt;access_token&gt;</code>. Mengembalikan JSON berisi <code className="font-mono text-slate-800">sub, username, name, email, role, avatar, organization</code>.
                </p>
              </div>

              {/* Endpoint 4: Revoke */}
              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 font-mono">
                    POST
                  </span>
                  <code className="font-mono font-semibold text-slate-900">/api/oauth/revoke</code>
                  <span className="text-slate-400 text-[11px]">- Endpoint Pencabutan Token / Logout Sesi (RFC 7009)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Parameter body: <code className="font-mono text-blue-600">token</code>, <code className="font-mono text-blue-600">client_id</code>, <code className="font-mono text-blue-600">client_secret</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Code Snippets Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900">Contoh Kode Integrasi Multi-Bahasa</span>
              </div>

              <div className="flex items-center gap-1">
                {(['nodejs', 'php', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer capitalize ${
                      activeCodeLang === lang
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {lang === 'nodejs' ? 'Node.js / JS' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>{codeSnippets[activeCodeLang].filename}</span>
                <button
                  onClick={() => handleCopy(activeCodeLang, codeSnippets[activeCodeLang].code)}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedKey === activeCodeLang ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto leading-relaxed p-2 text-emerald-300">
                <code>{codeSnippets[activeCodeLang].code}</code>
              </pre>
            </div>
          </div>

          {/* Interactive SSO Playground Simulator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Interactive SSO API Playground (Simulator)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uji alur otorisasi dan pemanggilan API SSO langsung di browser tanpa perlu setup backend terlebih dahulu
                </p>
              </div>

              <button
                onClick={runSimulation}
                disabled={simLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {simLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menghubungi SSO...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Simulasikan Autentikasi SSO</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client ID Aplikasi
                </label>
                <input
                  type="text"
                  value={simClientId}
                  onChange={(e) => setSimClientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Secret Aplikasi
                </label>
                <input
                  type="password"
                  value={simClientSecret}
                  onChange={(e) => setSimClientSecret(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Simulation Response Output */}
            {simResult && (
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hasil Respon API Real-Time
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Token Response */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                      <span>Response: POST /api/oauth/token</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <pre className="text-emerald-300 overflow-x-auto text-[11px]">
                      {JSON.stringify(simResult.tokenResponse, null, 2)}
                    </pre>
                  </div>

                  {/* Userinfo Response */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                      <span>Response: GET /api/oauth/userinfo</span>
                      <span className="text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <pre className="text-sky-300 overflow-x-auto text-[11px]">
                      {JSON.stringify(simResult.userinfoResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL CLIENT SDK (TYPESCRIPT) */}
      {mainTab === 'sdk' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Aruta SSO Official Client SDK</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Helper library resmi berbasis TypeScript universal (zero external dependencies). 
                  Bekerja di Node.js 18+, Next.js, Express, Bun, Vite, dan Deno.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('sdk-code', sdkTsCode)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedKey === 'sdk-code' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin SDK Helper</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>src/lib/sdk/aruta-auth-client.ts</span>
                <span className="text-blue-400 font-bold">TypeScript Universal</span>
              </div>
              <pre className="text-emerald-300 overflow-x-auto text-[11px] max-h-96 leading-relaxed">
                <code>{sdkTsCode}</code>
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-blue-600" />
                <span>Next.js API Callback</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Cukup panggil <code className="font-mono text-blue-600">handleCallback(code)</code> dalam 1 baris:
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-sky-300 overflow-x-auto">
{`// app/auth/callback/route.ts
export async function GET(req: Request) {
  const code = new URL(req.url)
    .searchParams.get('code')!;

  // 1-step exchange & user fetch
  const { user } = await tenAuth
    .handleCallback(code);

  return NextResponse.redirect('/app');
}`}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Popup Login (Google-Style)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Buka popup otentikasi tanpa reload halaman aktif:
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-purple-300 overflow-x-auto">
{`// Client Component / Browser
const handlePopup = async () => {
  try {
    const { code, user } = await tenAuth
      .loginWithPopup();
    console.log('User login:', user?.name);
  } catch (err) {
    console.error('Batal:', err);
  }
};`}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Token Revocation (Logout)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Cabut akses token seketika saat logout (RFC 7009):
              </p>
              <pre className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`// Logout endpoint
export async function POST(req: Request) {
  const token = req.headers
    .get('authorization')?.slice(7);
  if (token) {
    await tenAuth.revokeToken(token);
  }
  return NextResponse.json({ ok: true });
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OIDC DISCOVERY & NEXTAUTH */}
      {mainTab === 'oidc' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100 mb-2">
                  <Globe className="h-3 w-3" />
                  <span>RFC 8414 & OpenID Connect Discovery 1.0</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">Zero-Config OpenID Discovery Endpoint</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aplikasi klien tidak perlu mengkonfigurasi URL authorize, token, dan userinfo satu per satu. 
                  Library OIDC klien cukup membaca metadata dari URL Discovery di bawah ini:
                </p>
              </div>

              <a
                href="/.well-known/openid-configuration"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Buka JSON Metadata</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white font-mono uppercase">
                  GET
                </span>
                <code className="text-xs font-mono text-slate-800 font-semibold">
                  https://accounts.aruta.id/.well-known/openid-configuration
                </code>
              </div>

              <button
                onClick={() => handleCopy('oidc-url', 'https://accounts.aruta.id/.well-known/openid-configuration')}
                className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer shrink-0"
                title="Salin URL"
              >
                {copiedKey === 'oidc-url' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* NextAuth Example */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Integrasi NextAuth.js (Auth.js) Menggunakan OIDC Discovery</h3>
                <p className="text-xs text-slate-500">Cukup masukkan parameter <code className="font-mono text-blue-600">wellKnown</code>, NextAuth otomatis mendownload seluruh konfigurasi endpoint</p>
              </div>

              <button
                onClick={() => handleCopy('nextauth-code', nextAuthConfig)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                {copiedKey === 'nextauth-code' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Salin Config</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs font-mono">
              <pre className="text-sky-300 overflow-x-auto text-[11px] leading-relaxed">
                <code>{nextAuthConfig}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL UI BUTTON KIT */}
      {mainTab === 'uikit' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Official "Sign in with Aruta" Button Component</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan komponen tombol resmi dengan logo dan styling identitas Aruta terpadu di halaman login aplikasi Anda
              </p>
            </div>

            {/* Interactive Preview Box */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 flex flex-col items-center justify-center min-h-[160px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
                Live Interactive Preview ({uiMode === 'popup' ? 'Mode Popup Aktif' : 'Mode Redirect'})
              </span>

              <ArutaLoginButton
                variant={uiVariant}
                size={uiSize}
                mode={uiMode}
                loading={uiLoading}
                label={uiMode === 'popup' ? 'Masuk via Popup (Google-Style)' : 'Masuk dengan Akun Aruta'}
                href={`/api/oauth/authorize?client_id=${simClientId}&redirect_uri=https://finance.aruta.id/oauth/callback`}
                onAuthSuccess={(result) => {
                  setPopupAuthResult({
                    code: result.code,
                    state: result.state,
                  });
                }}
                onAuthError={(err) => {
                  alert(`Otorisasi dibatalkan: ${err.message}`);
                }}
              />

              {/* Popup Live Auth Result Banner */}
              {popupAuthResult && (
                <div className="mt-4 w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Autentikasi Popup Berhasil!</p>
                    <p className="text-[11px] text-emerald-700">
                      Jendela popup telah ditutup secara otomatis dan halaman ini <strong>tidak pernah reload</strong>.
                    </p>
                    <code className="block font-mono text-[10px] bg-emerald-100/80 px-2 py-1 rounded text-emerald-900 break-all">
                      Authorization Code: {popupAuthResult.code}
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* Customizer Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mode Alur</label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setUiMode('popup');
                      setPopupAuthResult(null);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border cursor-pointer ${
                      uiMode === 'popup'
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Popup
                  </button>
                  <button
                    onClick={() => {
                      setUiMode('redirect');
                      setPopupAuthResult(null);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border cursor-pointer ${
                      uiMode === 'redirect'
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Redirect
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Varian Tema</label>
                <div className="flex items-center gap-1.5">
                  {(['primary', 'dark', 'light'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setUiVariant(v)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg capitalize border cursor-pointer ${
                        uiVariant === v
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ukuran Tombol</label>
                <div className="flex items-center gap-1.5">
                  {(['sm', 'md', 'lg'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setUiSize(s)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg uppercase border cursor-pointer ${
                        uiSize === s
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State Loading</label>
                <button
                  onClick={() => setUiLoading(!uiLoading)}
                  className={`w-full px-3 py-1 text-xs font-medium rounded-lg border cursor-pointer ${
                    uiLoading
                      ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {uiLoading ? 'Status: Loading' : 'Status: Normal'}
                </button>
              </div>
            </div>

            {/* Code Snippet for JSX */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2 mb-2 text-[11px] text-slate-500">
                <span className="font-semibold">Kode JSX Siap Pakai ({uiMode === 'popup' ? 'Popup Mode' : 'Redirect Mode'}):</span>
                <button
                  onClick={() =>
                    handleCopy(
                      'btn-jsx',
                      uiMode === 'popup'
                        ? `<ArutaLoginButton\n  mode="popup"\n  variant="${uiVariant}"\n  size="${uiSize}"\n  href="https://accounts.aruta.id/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK"\n  onAuthSuccess={({ code }) => {\n    console.log("Login popup berhasil!", code);\n  }}\n/>`
                        : `<ArutaLoginButton\n  variant="${uiVariant}"\n  size="${uiSize}"\n  href="https://accounts.aruta.id/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK"\n/>`
                    )
                  }
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copiedKey === 'btn-jsx' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Salin JSX</span>
                </button>
              </div>
              <pre className="rounded-xl bg-slate-900 p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto">
                <code>
                  {uiMode === 'popup'
                    ? `<ArutaLoginButton 
  mode="popup"
  variant="${uiVariant}" 
  size="${uiSize}"${uiLoading ? '\n  loading={true}' : ''}
  href="https://accounts.aruta.id/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://myapp.aruta.id/callback" 
  onAuthSuccess={({ code, state }) => {
    // 1. Pengguna berhasil login via popup
    // 2. Kirim authorization code ke backend Anda untuk dibuatkan session
    console.log("Kode Otorisasi didapat:", code);
  }}
  onAuthError={(err) => {
    console.error("Popup login dibatalkan:", err.message);
  }}
/>`
                    : `<ArutaLoginButton 
  variant="${uiVariant}" 
  size="${uiSize}"${uiLoading ? '\n  loading={true}' : ''}
  href="https://accounts.aruta.id/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://myapp.aruta.id/callback&response_type=code" 
/>`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI AGENT & VIBE CODING PROMPTS */}
      {mainTab === 'ai-prompts' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/40 p-6 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 border border-purple-200 mb-2">
                  <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Vibe Coding & AI Agent Ready</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Kit Prompt Siap Pakai untuk AI Agent (Cursor, Claude, Antigravity, ChatGPT)
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Tidak perlu menulis kode integrasi manual. Cukup salin prompt terstruktur di bawah ini ke AI Agent atau Vibe Coding IDE Anda. 
                  AI akan memahami seluruh spesifikasi endpoint, kredensial, dan menyusun kode integrasi SSO Aruta dalam sekali instruksi (*one-shot*).
                </p>
              </div>
            </div>

            {/* Step Pills for How to Vibe Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl bg-white p-3.5 border border-purple-100 shadow-xs">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Langkah 1</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">Sesuaikan Kredensial</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Isi Client ID dan Redirect URI aplikasi Anda di form bawah.</p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-purple-100 shadow-xs">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Langkah 2</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">Salin Prompt AI</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Pilih framework target (Next.js, React, Laravel, dll) lalu klik Salin.</p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-purple-100 shadow-xs">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Langkah 3</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">Tempel ke AI Agent</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Tempel ke Cursor Composer, Antigravity, atau Claude Code CLI.</p>
              </div>
            </div>

            {/* LLMs.txt AI Knowledge Center Banner */}
            <div className="rounded-xl border border-purple-200 bg-purple-100/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs shrink-0">
                  AI
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Standard AI Knowledge Base (llms.txt)</span>
                    <span className="rounded bg-purple-200 text-purple-800 px-1.5 py-0.5 text-[10px] font-semibold">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Anda juga bisa langsung menyuruh AI Agent (Cursor / Windsurf) membaca file: <code className="font-mono text-purple-700 font-semibold">{typeof window !== 'undefined' ? window.location.origin : 'https://accounts.aruta.id'}/llms.txt</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy('llms-url', `${typeof window !== 'undefined' ? window.location.origin : 'https://accounts.aruta.id'}/llms.txt`)}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedKey === 'llms-url' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-purple-600" />}
                  <span>{copiedKey === 'llms-url' ? 'Tersalin!' : 'Salin URL llms.txt'}</span>
                </button>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka llms.txt</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Parameters Customizer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Pengaturan Variabel Proyek Anda</h3>
              <p className="text-xs text-slate-500 mt-0.5">Variabel di bawah akan otomatis terisi ke dalam prompt AI secara real-time:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Aplikasi</label>
                <input
                  type="text"
                  value={aiAppName}
                  onChange={(e) => setAiAppName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Contoh: Portal HR"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client ID SSO</label>
                <input
                  type="text"
                  value={aiClientId}
                  onChange={(e) => setAiClientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Client Secret</label>
                  <span className="text-[10px] text-amber-600 font-medium">⚠️ Rahasia (.env only)</span>
                </div>
                <input
                  type="text"
                  value={aiClientSecret}
                  onChange={(e) => setAiClientSecret(e.target.value)}
                  placeholder="ARUTA_CLIENT_SECRET_PLACEHOLDER"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Callback / Redirect URI</label>
                <input
                  type="text"
                  value={aiRedirectUri}
                  onChange={(e) => setAiRedirectUri(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Framework Selector & Mode */}
            <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Pilih Framework / Target Stack:</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'master', label: '⚡ One-Shot Master Prompt (Semua Framework)' },
                    { id: 'nextjs', label: 'Next.js (App Router)' },
                    { id: 'react-express', label: 'React + Express' },
                    { id: 'laravel', label: 'PHP / Laravel' },
                    { id: 'fastapi', label: 'Python (FastAPI)' },
                  ].map((fw) => (
                    <button
                      key={fw.id}
                      onClick={() => setAiFramework(fw.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        aiFramework === fw.id
                          ? 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {fw.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Gaya Alur Login:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAiLoginMode('popup')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      aiLoginMode === 'popup'
                        ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Popup (Google-Style)
                  </button>
                  <button
                    onClick={() => setAiLoginMode('redirect')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      aiLoginMode === 'redirect'
                        ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Redirect Halaman
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-3">
            <div className="p-1 rounded-md bg-amber-100 text-amber-700 mt-0.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold text-amber-900">
                Praktik Keamanan Kredensial AI (Zero-Leak Policy)
              </p>
              <p className="text-amber-800 leading-relaxed">
                <strong>Client ID</strong> dan <strong>Redirect URI</strong> aman dibagikan ke AI agent karena merupakan konfigurasi publik. Namun, <strong>Client Secret</strong> adalah rahasia backend. Jangan tempelkan secret produksi asli Anda ke dalam prompt AI! Cukup gunakan placeholder default, lalu letakkan Client Secret asli Anda di file <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">.env.local</code> aplikasi Anda.
              </p>
            </div>
          </div>

          {/* Generated Prompt Box */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900">
                  Prompt Siap Pakai untuk AI Agent ({aiFramework.toUpperCase()} • {aiLoginMode.toUpperCase()})
                </span>
              </div>

              <button
                onClick={() => handleCopy('ai-prompt', generateAiPrompt())}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                {copiedKey === 'ai-prompt' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    <span>Prompt Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-white" />
                    <span>Salin Prompt untuk AI Agent</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed p-2 text-purple-200 max-h-[420px]">
                <code>{generateAiPrompt()}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
