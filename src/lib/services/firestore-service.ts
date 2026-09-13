import { getFirebaseApp, getFirebaseDb, setFirebaseDb, isFirebaseConfigured } from '@/lib/firebase/client';
import type { Firestore } from 'firebase/firestore';
import { 
  SSOUser, 
  SSORole, 
  SSOPermission, 
  RegisteredApp, 
  SSOSettings, 
  SSOAuditLog 
} from '@/types/sso';

// In-Memory & LocalStorage Cache fallback for zero-config offline or dev testing
const LOCAL_STORAGE_KEY_PREFIX = 'sso_aruta_';

// Helper to remove undefined properties before sending to Firestore
function cleanData<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

let _cachedDb: Firestore | null = null;

// Convert Firestore REST typed value object to plain JavaScript primitive/object
function parseFirestoreValue(valueObj: any): any {
  if (!valueObj || typeof valueObj !== 'object') return valueObj;
  if ('stringValue' in valueObj) return valueObj.stringValue;
  if ('booleanValue' in valueObj) return valueObj.booleanValue;
  if ('integerValue' in valueObj) return Number(valueObj.integerValue);
  if ('doubleValue' in valueObj) return Number(valueObj.doubleValue);
  if ('timestampValue' in valueObj) return valueObj.timestampValue;
  if ('nullValue' in valueObj) return null;
  if ('arrayValue' in valueObj) {
    const values = valueObj.arrayValue?.values || [];
    return values.map(parseFirestoreValue);
  }
  if ('mapValue' in valueObj) {
    const fields = valueObj.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return valueObj;
}

function parseFirestoreDoc<T>(doc: any): T {
  const fields = doc.fields || {};
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    res[k] = parseFirestoreValue(v);
  }
  return res as T;
}

// Server-side direct Firestore REST helper (100% compatible with Cloudflare Workers isolate)
async function fetchFirestoreCollectionREST<T>(collectionName: string): Promise<T[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return [];

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?key=${apiKey}&pageSize=100`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return [];
      console.warn(`[Server Firestore REST] GET ${collectionName} returned ${res.status}`);
      return [];
    }
    const json: any = await res.json();
    const documents = json.documents || [];
    return documents.map((doc: any) => parseFirestoreDoc<T>(doc));
  } catch (err) {
    console.error(`[Server Firestore REST] Error fetching ${collectionName}:`, err);
    return [];
  }
}

async function fetchFirestoreDocREST<T>(collectionName: string, docId: string): Promise<T | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    return parseFirestoreDoc<T>(json);
  } catch (err) {
    console.error(`[Server Firestore REST] Error fetching ${collectionName}/${docId}:`, err);
    return null;
  }
}

// Lazy loader for Firestore to ensure zero eval/codegen errors in Cloudflare Workers workerd runtime
async function getFirestoreModule() {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }
  try {
    const fs = await import('firebase/firestore');
    if (!_cachedDb) {
      const app = getFirebaseApp();
      try {
        _cachedDb = fs.initializeFirestore(app, {
          ignoreUndefinedProperties: true,
        });
      } catch {
        _cachedDb = fs.getFirestore(app);
      }
      setFirebaseDb(_cachedDb);
    }
    return { fs, db: _cachedDb };
  } catch (err) {
    console.error('[SSO Firestore] Failed to initialize Firestore module:', err);
    return null;
  }
}

const defaultPermissions: SSOPermission[] = [
  { id: 'perm-1', key: 'users.read', name: 'View Users', category: 'users', description: 'Can view list of users and profiles' },
  { id: 'perm-2', key: 'users.write', name: 'Manage Users', category: 'users', description: 'Can create, edit, suspend, and delete users' },
  { id: 'perm-3', key: 'roles.manage', name: 'Manage Roles', category: 'roles', description: 'Can create and assign roles and permissions' },
  { id: 'perm-4', key: 'apps.manage', name: 'Manage OAuth Apps', category: 'apps', description: 'Can register, modify, and revoke client applications' },
  { id: 'perm-5', key: 'sso.authorize', name: 'Authorize SSO', category: 'sso', description: 'Can perform single sign-on authorization to connected apps' },
  { id: 'perm-6', key: 'settings.manage', name: 'System Settings', category: 'settings', description: 'Can modify global SSO and security parameters' },
  { id: 'perm-7', key: 'audit.read', name: 'View Audit Logs', category: 'audit', description: 'Can view security and authentication audit trail' },
];

const defaultRoles: SSORole[] = [
  {
    id: 'role-superadmin',
    name: 'Superadmin',
    description: 'Full administrative access across all SSO modules and clients',
    permissions: ['users.read', 'users.write', 'roles.manage', 'apps.manage', 'sso.authorize', 'settings.manage', 'audit.read'],
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Administrative access to manage users, apps, and view logs',
    permissions: ['users.read', 'users.write', 'apps.manage', 'sso.authorize', 'audit.read'],
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role-member',
    name: 'Member',
    description: 'Standard account access with SSO authorization rights to designated apps',
    permissions: ['sso.authorize'],
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
];

const defaultApps: RegisteredApp[] = [
  {
    id: 'app-aruta-portal',
    name: 'Portal Utama Aruta.id',
    description: 'Portal pusat informasi, publikasi, dan hub utama ekosistem Arut Utara',
    clientId: 'aruta_portal_01',
    clientSecret: 'sec_live_aruta_portal_secret_key_8921',
    redirectUris: ['https://aruta.id/auth/callback', 'https://www.aruta.id/auth/callback', 'http://localhost:3001/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email', 'roles'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-riset',
    name: 'Pusat Riset Arut Utara',
    description: 'Jurnal penelitian, publikasi ilmiah, dan dataset sains terbuka kawasan Arut',
    clientId: 'aruta_riset_02',
    clientSecret: 'sec_live_aruta_riset_secret_key_7712',
    redirectUris: ['https://riset.aruta.id/auth/callback', 'http://localhost:3002/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-pustaka',
    name: 'Pustaka & Arsip Adat',
    description: 'Arsip sejarah, manuskrip kebudayaan, dan rekaman tutur lisan Dayak Arut',
    clientId: 'aruta_pustaka_03',
    clientSecret: 'sec_live_aruta_pustaka_secret_key_3345',
    redirectUris: ['https://pustaka.aruta.id/auth/callback', 'http://localhost:3003/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-bahasa',
    name: 'Preservasi Bahasa Dayak Arut',
    description: 'Kamus digital, korpus dialek lokal, dan preservasi leksikon bahasa daerah',
    clientId: 'aruta_bahasa_04',
    clientSecret: 'sec_live_aruta_bahasa_secret_key_9182',
    redirectUris: ['https://bahasa.aruta.id/auth/callback', 'http://localhost:3004/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-peta',
    name: 'Peta & Geospasial Arut Utara',
    description: 'Sistem informasi geospasial (GIS), batas adat, bentang alam, dan peta tematik',
    clientId: 'aruta_peta_05',
    clientSecret: 'sec_live_aruta_peta_secret_key_6621',
    redirectUris: ['https://peta.aruta.id/auth/callback', 'http://localhost:3005/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-ruang',
    name: 'Ruang Komunitas & Pemuda',
    description: 'Wadah kolaborasi, agenda pemuda, diskusi warga, dan inovasi desa Arut Utara',
    clientId: 'aruta_ruang_06',
    clientSecret: 'sec_live_aruta_ruang_secret_key_5519',
    redirectUris: ['https://ruang.aruta.id/auth/callback', 'http://localhost:3006/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-kelola',
    name: 'Pusat Kelola Data Aruta',
    description: 'Konsol manajemen sumber daya, rest api data, dan integrasi layanan publik',
    clientId: 'aruta_kelola_07',
    clientSecret: 'sec_live_aruta_kelola_secret_key_1194',
    redirectUris: ['https://kelola.aruta.id/auth/callback', 'http://localhost:3007/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email', 'roles'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-album',
    name: 'Galeri Visual Arut Utara',
    description: 'Dokumentasi visual fotografi lanskap alam, flora-fauna, dan masyarakat Arut',
    clientId: 'aruta_album_08',
    clientSecret: 'sec_live_aruta_album_secret_key_4432',
    redirectUris: ['https://album.aruta.id/auth/callback', 'http://localhost:3008/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-aruta-vtour',
    name: 'Virtual Tour Arut Utara',
    description: 'Eksplorasi panorama interaktif 360 derajat kekayaan alam dan sejarah Arut Utara',
    clientId: 'aruta_vtour_09',
    clientSecret: 'sec_live_aruta_vtour_secret_key_2210',
    redirectUris: ['https://vtour.aruta.id/auth/callback', 'http://localhost:3009/auth/callback'],
    logoUrl: '',
    isActive: true,
    allowedScopes: ['openid', 'profile', 'email'],
    createdAt: new Date().toISOString(),
  }
];

const defaultSettings: SSOSettings = {
  appName: 'Aruta Single Sign-On',
  companyName: 'Aruta.id',
  supportEmail: 'admin@aruta.id',
  allowRegistration: true,
  requireEmailVerification: false,
  sessionTimeoutHours: 72,
  defaultRoleId: 'role-member',
  allowedRedirectDomains: ['aruta.id', 'localhost'],
  updatedAt: new Date().toISOString(),
};

// Storage helper for browser local fallback
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

// ----------------------------------------------------
// USER REPOSITORY
// ----------------------------------------------------
export async function getUserProfile(identifier: string): Promise<SSOUser | null> {
  const decoded = decodeURIComponent(identifier || '');
  const clean = decoded.replace(/^@/, '').toLowerCase().trim();

  if (typeof window === 'undefined') {
    if (isFirebaseConfigured()) {
      const doc = await fetchFirestoreDocREST<SSOUser>('users', decoded);
      if (doc) return doc;
      const allUsers = await fetchFirestoreCollectionREST<SSOUser>('users');
      return allUsers.find(u => u.uid === decoded || (u.username && u.username.toLowerCase() === clean)) || null;
    }
    return null;
  }

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      // First try by direct document ID (uid)
      const userRef = fs.doc(db, 'users', decoded);
      const snap = await fs.getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as SSOUser;
      }

      // Try by username query
      const q = fs.query(fs.collection(db, 'users'), fs.where('username', '==', clean), fs.limit(1));
      const querySnap = await fs.getDocs(q);
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as SSOUser;
      }
    } catch (e) {
      console.error('[SSO Firestore] getUserProfile failed:', e);
    }

    if (isFirebaseConfigured()) {
      return null;
    }
  }

  // Offline development fallback only when Firebase is NOT configured
  if (!isFirebaseConfigured()) {
    const users = getLocalItem<SSOUser[]>('users', []);
    return (
      users.find(
        (u) => u.uid === decoded || (u.username && u.username.toLowerCase() === clean)
      ) || null
    );
  }

  return null;
}

export async function isUsernameAvailable(username: string, excludeUid?: string): Promise<boolean> {
  const clean = username.replace(/^@/, '').toLowerCase().trim();

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const q = fs.query(fs.collection(db, 'users'), fs.where('username', '==', clean), fs.limit(2));
      const querySnap = await fs.getDocs(q);
      if (querySnap.empty) return true;
      const matches = querySnap.docs.map(d => d.data() as SSOUser);
      return matches.every(u => u.uid === excludeUid);
    } catch (e) {
      console.error('[SSO Firestore] isUsernameAvailable failed:', e);
    }

    if (isFirebaseConfigured()) {
      return true;
    }
  }

  const users = getLocalItem<SSOUser[]>('users', []);
  const existing = users.find(
    (u) => u.username && u.username.toLowerCase() === clean && u.uid !== excludeUid
  );
  return !existing;
}

export async function saveUserProfile(user: SSOUser): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const userRef = fs.doc(db, 'users', user.uid);
      const dataToSave = cleanData({
        ...user,
        updatedAt: new Date().toISOString(),
      });
      await fs.setDoc(userRef, dataToSave, { merge: true });
      return;
    } catch (e) {
      console.error('[SSO Firestore] saveUserProfile failed, falling back to local store:', e);
    }
  }

  const users = getLocalItem<SSOUser[]>('users', []);
  const idx = users.findIndex((u) => u.uid === user.uid);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user, updatedAt: new Date().toISOString() };
  } else {
    users.push(user);
  }
  setLocalItem('users', users);
}

export async function listAllUsers(): Promise<SSOUser[]> {
  if (typeof window === 'undefined') {
    if (isFirebaseConfigured()) {
      return await fetchFirestoreCollectionREST<SSOUser>('users');
    }
    return [];
  }

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const snap = await fs.getDocs(fs.collection(db, 'users'));
      return snap.docs.map(d => d.data() as SSOUser);
    } catch (e) {
      console.error('[SSO Firestore] listAllUsers failed:', e);
      return [];
    }
  }

  // If Firebase is configured, strictly do NOT return dummy users
  if (isFirebaseConfigured()) {
    return [];
  }

  return getLocalItem<SSOUser[]>('users', []);
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.deleteDoc(fs.doc(db, 'users', uid));
      return;
    } catch (e) {
      console.error('[SSO Firestore] deleteUserProfile failed:', e);
    }
  }

  const users = getLocalItem<SSOUser[]>('users', []);
  const filtered = users.filter(u => u.uid !== uid);
  setLocalItem('users', filtered);
}

export const listRoles = getRoles;
export const listPermissions = getPermissions;

export async function updateUserRole(uid: string, roleName: string, roleId: string): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.updateDoc(fs.doc(db, 'users', uid), {
        role: roleName,
        roleId: roleId,
        updatedAt: new Date().toISOString()
      });
      return;
    } catch (e) {
      console.warn('Firestore updateUserRole fallback', e);
    }
  }

  const users = await listAllUsers();
  const idx = users.findIndex(u => u.uid === uid);
  if (idx >= 0) {
    users[idx].role = roleName;
    users[idx].roleId = roleId;
    setLocalItem('users', users);
  }
}

export async function updateUserStatus(uid: string, status: 'active' | 'suspended' | 'pending'): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.updateDoc(fs.doc(db, 'users', uid), {
        status,
        updatedAt: new Date().toISOString()
      });
      return;
    } catch (e) {
      console.warn('Firestore updateUserStatus fallback', e);
    }
  }

  const users = await listAllUsers();
  const idx = users.findIndex(u => u.uid === uid);
  if (idx >= 0) {
    users[idx].status = status;
    setLocalItem('users', users);
  }
}

// ----------------------------------------------------
// ROLES & PERMISSIONS REPOSITORY
// ----------------------------------------------------
export async function getRoles(): Promise<SSORole[]> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const snap = await fs.getDocs(fs.collection(db, 'roles'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as SSORole);
      }
    } catch (e) {
      console.warn('Firestore getRoles fallback', e);
    }
  }

  const roles = getLocalItem<SSORole[]>('roles', defaultRoles);
  setLocalItem('roles', roles);
  return roles;
}

export async function saveRole(role: SSORole): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.setDoc(fs.doc(db, 'roles', role.id), cleanData(role as unknown as Record<string, unknown>), { merge: true });
      return;
    } catch (e) {
      console.error('[SSO Firestore] saveRole failed, fallback to local store:', e);
    }
  }

  const roles = getLocalItem<SSORole[]>('roles', defaultRoles);
  const idx = roles.findIndex(r => r.id === role.id);
  if (idx >= 0) {
    roles[idx] = role;
  } else {
    roles.push(role);
  }
  setLocalItem('roles', roles);
}

export async function deleteRole(roleId: string): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.deleteDoc(fs.doc(db, 'roles', roleId));
      return;
    } catch (e) {
      console.warn('Firestore deleteRole fallback', e);
    }
  }

  const roles = getLocalItem<SSORole[]>('roles', defaultRoles).filter(r => r.id !== roleId);
  setLocalItem('roles', roles);
}

export async function getPermissions(): Promise<SSOPermission[]> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const snap = await fs.getDocs(fs.collection(db, 'permissions'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as SSOPermission);
      }
    } catch (e) {
      console.warn('Firestore getPermissions fallback', e);
    }
  }

  const perms = getLocalItem<SSOPermission[]>('permissions', defaultPermissions);
  setLocalItem('permissions', perms);
  return perms;
}

export async function savePermission(perm: SSOPermission): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.setDoc(fs.doc(db, 'permissions', perm.id), cleanData(perm as unknown as Record<string, unknown>), { merge: true });
      return;
    } catch (e) {
      console.error('[SSO Firestore] savePermission failed, fallback to local store:', e);
    }
  }

  const perms = getLocalItem<SSOPermission[]>('permissions', defaultPermissions);
  const idx = perms.findIndex(p => p.id === perm.id);
  if (idx >= 0) {
    perms[idx] = perm;
  } else {
    perms.push(perm);
  }
  setLocalItem('permissions', perms);
}

export async function deletePermission(permId: string): Promise<void> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.deleteDoc(fs.doc(db, 'permissions', permId));
      return;
    } catch (e) {
      console.error('[SSO Firestore] deletePermission fallback:', e);
    }
  }

  const perms = getLocalItem<SSOPermission[]>('permissions', defaultPermissions).filter(p => p.id !== permId);
  setLocalItem('permissions', perms);
}

// ----------------------------------------------------
// REGISTERED OAUTH APPS REPOSITORY
// ----------------------------------------------------
export async function listRegisteredApps(): Promise<RegisteredApp[]> {
  const localApps = getLocalItem<RegisteredApp[]>('apps', defaultApps);

  if (typeof window === 'undefined') {
    if (isFirebaseConfigured()) {
      const remoteApps = await fetchFirestoreCollectionREST<RegisteredApp>('apps');
      return remoteApps.length > 0 ? remoteApps : defaultApps;
    }
    return defaultApps;
  }

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const snap = await fs.getDocs(fs.collection(db, 'apps'));
      if (!snap.empty) {
        const firestoreApps = snap.docs.map(d => d.data() as RegisteredApp);
        // Combine Firestore apps with any local apps
        const map = new Map<string, RegisteredApp>();
        localApps.forEach(a => map.set(a.id, a));
        firestoreApps.forEach(a => map.set(a.id, a));
        const merged = Array.from(map.values());
        setLocalItem('apps', merged);
        return merged;
      } else {
        // If Firestore apps collection is empty, seed defaultApps
        try {
          for (const a of defaultApps) {
            await fs.setDoc(fs.doc(db, 'apps', a.id), cleanData(a as unknown as Record<string, unknown>), { merge: true });
          }
        } catch (seedErr) {
          console.warn('[SSO Firestore] Auto-seed apps warning:', seedErr);
        }
        return localApps;
      }
    } catch (e) {
      console.error('[SSO Firestore] listRegisteredApps error:', e);
      return localApps;
    }
  }

  return localApps;
}

export async function getAppByClientId(clientId: string): Promise<RegisteredApp | null> {
  if (typeof window === 'undefined') {
    if (isFirebaseConfigured()) {
      const apps = await fetchFirestoreCollectionREST<RegisteredApp>('apps');
      const found = apps.find(a => a.clientId === clientId && a.isActive);
      if (found) return found;
      return defaultApps.find(a => a.clientId === clientId && a.isActive) || null;
    }
    return defaultApps.find(a => a.clientId === clientId && a.isActive) || null;
  }

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const q = fs.query(fs.collection(db, 'apps'), fs.where('clientId', '==', clientId), fs.limit(1));
      const snap = await fs.getDocs(q);
      if (!snap.empty) {
        const app = snap.docs[0].data() as RegisteredApp;
        return app.isActive ? app : null;
      }
    } catch (e) {
      console.error('[SSO Firestore] getAppByClientId error:', e);
    }
  }

  const apps = await listRegisteredApps();
  return apps.find(a => a.clientId === clientId && a.isActive) || null;
}

export async function saveRegisteredApp(appData: RegisteredApp): Promise<void> {
  // 1. Save to localStorage immediately so UI updates instantly
  const apps = getLocalItem<RegisteredApp[]>('apps', defaultApps);
  const idx = apps.findIndex(a => a.id === appData.id);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...appData, updatedAt: new Date().toISOString() };
  } else {
    apps.unshift({ ...appData, updatedAt: new Date().toISOString() });
  }
  setLocalItem('apps', apps);

  // 2. Persist to Firestore
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const payload = cleanData({
        ...appData,
        updatedAt: new Date().toISOString(),
      });
      await fs.setDoc(fs.doc(db, 'apps', appData.id), payload, { merge: true });
    } catch (e) {
      console.error('[SSO Firestore] saveRegisteredApp failed:', e);
      throw e;
    }
  }
}

export async function deleteRegisteredApp(appId: string): Promise<void> {
  // 1. Remove from local store immediately
  const apps = getLocalItem<RegisteredApp[]>('apps', defaultApps).filter(a => a.id !== appId);
  setLocalItem('apps', apps);

  // 2. Remove from Firestore
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.deleteDoc(fs.doc(db, 'apps', appId));
    } catch (e) {
      console.error('[SSO Firestore] deleteRegisteredApp failed:', e);
      throw e;
    }
  }
}

// ----------------------------------------------------
// SETTINGS REPOSITORY
// ----------------------------------------------------
export async function getSSOSettings(): Promise<SSOSettings> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const snap = await fs.getDoc(fs.doc(db, 'settings', 'sso'));
      if (snap.exists()) {
        return snap.data() as SSOSettings;
      }
    } catch (e) {
      console.warn('Firestore getSSOSettings fallback', e);
    }
  }

  const settings = getLocalItem<SSOSettings>('settings', defaultSettings);
  setLocalItem('settings', settings);
  return settings;
}

export async function saveSSOSettings(settings: SSOSettings): Promise<void> {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.setDoc(fs.doc(db, 'settings', 'sso'), cleanData(updated as unknown as Record<string, unknown>), { merge: true });
      return;
    } catch (e) {
      console.error('[SSO Firestore] saveSSOSettings failed, fallback to local store:', e);
    }
  }

  setLocalItem('settings', updated);
}

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
export async function logSSOEvent(
  action: SSOAuditLog['action'], 
  userEmail: string, 
  detail: string, 
  userId: string = 'system'
): Promise<void> {
  const logItem: SSOAuditLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    userId,
    userEmail,
    action,
    detail,
    timestamp: new Date().toISOString(),
  };

  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      await fs.setDoc(fs.doc(db, 'audit_logs', logItem.id), cleanData(logItem as unknown as Record<string, unknown>));
    } catch (e) {
      console.error('[SSO Firestore] logSSOEvent failed, fallback to local store:', e);
    }
  }

  const logs = getLocalItem<SSOAuditLog[]>('audit_logs', []);
  logs.unshift(logItem);
  if (logs.length > 100) logs.pop();
  setLocalItem('audit_logs', logs);
}

export async function getRecentAuditLogs(count: number = 20): Promise<SSOAuditLog[]> {
  const f = await getFirestoreModule();
  if (f) {
    try {
      const { fs, db } = f;
      const q = fs.query(fs.collection(db, 'audit_logs'), fs.orderBy('timestamp', 'desc'), fs.limit(count));
      const snap = await fs.getDocs(q);
      return snap.docs.map(d => d.data() as SSOAuditLog);
    } catch (e) {
      console.error('[SSO Firestore] getRecentAuditLogs error:', e);
      if (isFirebaseConfigured()) {
        return [];
      }
    }
  }

  if (isFirebaseConfigured()) {
    return [];
  }

  const logs = getLocalItem<SSOAuditLog[]>('audit_logs', []);
  return logs.slice(0, count);
}
