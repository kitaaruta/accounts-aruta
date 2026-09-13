import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const markdown = `# Aruta SSO — Central Identity & Access Management Infrastructure
> Platform Single Sign-On (SSO) dan Identity Provider resmi untuk seluruh ekosistem digital Aruta.id dan aplikasi mitra.

## 1. Arsitektur & Filosofi Sistem
- **Single Source of Truth**: Seluruh akun pengguna, identitas, profil, hak akses (RBAC), dan otorisasi dibuat, diedit, dan diautentikasi hanya melalui Aruta SSO (${baseUrl}).
- **Aplikasi Klien / Satelit**: Aplikasi-aplikasi dalam ekosistem Aruta (misal: riset.aruta.id, pustaka.aruta.id, bahasa.aruta.id, peta.aruta.id, kelola.aruta.id) atau aplikasi pihak ketiga bertindak sebagai **OAuth 2.0 / OpenID Connect (OIDC) Relying Party (RP)**.
- **Tanpa Password Lokal**: Aplikasi klien tidak menyimpan password pengguna; aplikasi klien hanya menyimpan sesi berdasarkan token terverifikasi dari Aruta SSO.

## 2. Spesifikasi Endpoint SSO
- **Issuer URL**: ${baseUrl}
- **OIDC Discovery**: ${baseUrl}/.well-known/openid-configuration
- **JWKS Endpoint**: ${baseUrl}/.well-known/jwks.json
- **Authorization Endpoint**: ${baseUrl}/api/oauth/authorize
- **Token Exchange Endpoint**: ${baseUrl}/api/oauth/token
- **Userinfo Profile Endpoint**: ${baseUrl}/api/oauth/userinfo
- **Token Revocation Endpoint**: ${baseUrl}/api/oauth/revoke

## 3. Data Pengguna (User Claims Schema)
Endpoint \`/api/oauth/userinfo\` mengembalikan JSON profil standar:
\`\`\`json
{
  "sub": "usr_981247921a",            // Unique User ID (permanen)
  "name": "Ahmad Fadil",             // Nama lengkap pengguna
  "username": "ahmad_aruta",          // Handle unik pengguna (tanpa @)
  "email": "ahmad@aruta.id",          // Email resmi pengguna
  "email_verified": true,             // Status verifikasi email
  "picture": "https://...",           // URL foto profil pengguna (atau null)
  "avatar": "https://...",            // Alias untuk picture
  "role": "Member",                   // Peran utama: Superadmin | Admin | Member | Peneliti | Kontributor
  "status": "active",                 // active | suspended
  "company": "Pusat Riset Arut",      // Instansi / Organisasi
  "title": "Peneliti Lapangan",       // Jabatan / Peran kerja
  "phone": "+6281234567890"           // Nomor telepon pengguna
}
\`\`\`

> **Catatan Keamanan Akun:** Jika \`status !== 'active'\`, aplikasi klien WAJIB menolak akses login pengguna karena akun sedang ditangguhkan secara terpusat oleh pengelola SSO.

## 4. Alur Autentikasi yang Didukung

### A. Mode Popup Window (Google-Style)
Cocok untuk Single Page Application (SPA), React, Vue, Next.js:
1. Frontend membuka jendela popup:
   \`\`\`javascript
   const popup = window.open(
     "${baseUrl}/api/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=openid+profile+email&prompt=consent",
     "ArutaSSO",
     "width=500,height=650"
   );
   \`\`\`
2. Setelah pengguna menyetujui izin di halaman Consent SSO, halaman callback mengirim pesan ke window induk:
   \`\`\`javascript
   window.opener.postMessage({ type: 'ARUTA_SSO_SUCCESS', code: authCode, state }, window.location.origin);
   window.close();
   \`\`\`
3. Window induk menangkap event \`message\` dan mengirim authorization code ke server backend untuk ditukar dengan token & session.

### B. Mode Full Page Redirect (Standard OAuth2)
Cocok untuk Laravel, Django, FastAPI, Express:
1. User diarahkan ke \`${baseUrl}/api/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&state=CSRF_TOKEN\`
2. SSO mengalihkan kembali ke \`REDIRECT_URI?code=AUTH_CODE&state=CSRF_TOKEN\`
3. Backend memanggil \`POST ${baseUrl}/api/oauth/token\` membawa \`code\`, \`client_id\`, \`client_secret\`, dan \`redirect_uri\`.
4. Backend memanggil \`GET ${baseUrl}/api/oauth/userinfo\` dengan header \`Authorization: Bearer ACCESS_TOKEN\`.

## 5. Logout & Revokasi
Saat pengguna logout dari aplikasi klien, panggil endpoint pencabutan token:
\`\`\`bash
POST ${baseUrl}/api/oauth/revoke
Content-Type: application/json

{
  "token": "ACCESS_TOKEN",
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET"
}
\`\`\`

## 6. Integrasi Cepat dengan SDK Resmi
Gunakan SDK TypeScript resmi Aruta:
\`\`\`typescript
import { ArutaAuthClient } from '@/lib/sdk/aruta-auth-client';

export const arutaAuth = new ArutaAuthClient({
  clientId: process.env.ARUTA_CLIENT_ID!,
  clientSecret: process.env.ARUTA_CLIENT_SECRET!,
  redirectUri: process.env.ARUTA_REDIRECT_URI!,
  baseUrl: "${baseUrl}"
});
\`\`\`
`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
