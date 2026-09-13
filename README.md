# Aruta SSO — Centralized Identity & Access Management Infrastructure

Infrastruktur **Single Sign-On (SSO)** resmi untuk ekosistem **Aruta.id** (Ekosistem Digital & Riset Terpadu Arut Utara, Kotawaringin Barat). Dibangun menggunakan **Next.js (App Router)**, **Firebase Authentication (Email & Password)**, **Cloud Firestore**, dan **Cloudflare Wrangler**.

Sistem ini berfungsi sebagai *Single Source of Truth*: akun pengguna dibuat, diedit, dinonaktifkan, dihapus, diautentikasi, dan diotorisasi ke seluruh layanan publik ekosistem Aruta.id (`aruta.id`, `riset.aruta.id`, `pustaka.aruta.id`, `bahasa.aruta.id`, `peta.aruta.id`, `ruang.aruta.id`, `kelola.aruta.id`, `album.aruta.id`, `vtour.aruta.id`) hanya melalui sistem ini.

---

## 🌟 Fitur Utama & Modul

1. **Autentikasi Terpadu (`/auth/*`)**
   - **Login (`/auth/login`)**: Autentikasi email & password via Firebase Auth, mendukung alur redirect SSO (`client_id`, `redirect_uri`) dan popup SSO.
   - **Register (`/auth/register`)**: Pendaftaran akun SSO baru dengan sinkronisasi instan ke Firestore `users/{uid}`.
   - **Lupa Kata Sandi (`/auth/forgot-password`)**: Permintaan tautan pemulihan email.
   - **Reset Kata Sandi (`/auth/reset-password`)**: Pembaruan kata sandi baru dengan kode verifikasi `oobCode`.

2. **Portal Pengguna & Administrator**
   - **Portal User & Profil (`/profile`, `/portal`)**: Dashboard pengguna terpadu dengan *Kartu Profil Digital*, status identitas, dan *App Launcher* 1-klik SSO ke aplikasi-aplikasi ekosistem Aruta.
   - **Portal Admin (`/admin`)**: Monitoring pusat kesehatan SSO, metrik total pengguna, aplikasi terdaftar, katalog peran & izin, serta riwayat *audit trail* terkini.

3. **Modul Pengelolaan Akun & Hak Akses**
   - **Akun (`/account`)**: Manajemen profil identitas (Nama, Organisasi, Jabatan, Telepon) dan penggantian kata sandi langsung.
   - **Pengguna (`/admin/users`)**: CRUD akun pengguna lengkap (tambah pengguna baru oleh admin, edit data, ubah status active/suspended, dan hapus akun permanen).
   - **Aplikasi (`/admin/apps`)**: Manajemen OAuth2 Clients untuk seluruh sub-domain Aruta (Client ID, Client Secret, whitelist Redirect URIs, dan allowed scopes).
   - **Peran (`/admin/roles`)**: RBAC terstruktur untuk mengatur peran sistem (Superadmin, Admin, Member, Kontributor, Peneliti) dan pemetaan izin.
   - **Hak Akses (`/admin/permissions`)**: Katalog izin granular sistem (Users, Roles, Apps, SSO, Settings, Audit).
   - **Pengaturan (`/admin/settings`)**: Konfigurasi global SSO, kebijakan pendaftaran mandiri, durasi sesi, dan whitelist domain `aruta.id`.

4. **SSO OAuth2 Engine (`/api/oauth/*`) & Developer Docs (`/admin/docs`, `/docs`)**
   - `GET /api/oauth/authorize`: Endpoint otorisasi SSO untuk aplikasi eksternal/subdomain.
   - `POST /api/oauth/token`: Endpoint penukaran kode otorisasi menjadi Access Token (JWT terenkripsi dengan `jose`).
   - `GET /api/oauth/userinfo`: Endpoint verifikasi token dan pengembalian profil identitas standar.
   - `GET /.well-known/openid-configuration`: Dokumen OIDC discovery resmi.
   - **Official Client SDK**: `src/lib/sdk/aruta-auth-client.ts` & `src/components/sdk/ArutaLoginButton.tsx`.

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Salin Environment Variables
```bash
cp .env.example .env.local
```

Isi konfigurasi Firebase Client Anda dari **Firebase Console > Project Settings > General > Your apps**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=accounts-aruta-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=accounts-aruta-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=accounts-aruta-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
SSO_JWT_SECRET=super-secure-sso-jwt-secret-key-aruta-id-min-32-chars-length
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Catatan:** Sistem telah dilengkapi *zero-config resilient fallback* di mana Anda dapat langsung menguji login, register, dan seluruh antarmuka admin/user tanpa error bahkan sebelum mengisi kredensial Firebase asli!

### 2. Konfigurasi Aturan Firestore (Security Rules)
Salin isi file [`firestore.rules`](./firestore.rules) ke **Firebase Console > Firestore Database > Rules** lalu klik **Publish**, atau gunakan Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### 3. Jalankan Mode Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Build & Validasi Typecheck
```bash
npm run build:next
```

---

## ☁️ Deployment ke Cloudflare menggunakan Wrangler

Aplikasi ini telah dikonfigurasi dengan `wrangler.jsonc` untuk deployment ke Cloudflare Workers / Pages:

```bash
# Login ke Cloudflare
npx wrangler login

# Deploy menggunakan OpenNext Cloudflare adapter
npm run deploy
```

---

## 🎨 Desain Antarmuka

Antarmuka dirancang dengan standar profesional bertema **minimalis terang (*clean light theme*)**:
- Tipografi tajam dengan Geist Sans & Geist Mono
- Border halus bernuansa slate (`#e2e8f0`) dengan kartu putih bersih (`#ffffff`)
- Status badge kontras dan elegan
- Micro-interactions responsif di seluruh tombol dan formulir.
