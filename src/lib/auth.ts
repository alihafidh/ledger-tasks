// Client-side accounts. Credentials never leave the browser: passwords are
// PBKDF2-hashed and stored in localStorage, and each account gets its own
// task store. Swap this module for a real auth provider (Supabase, Clerk…)
// to move accounts to a server.

export type User = { id: string; name: string; email: string; createdAt: number };

type StoredUser = User & { salt: string; hash: string };

const USERS_KEY = 'ledger.users.v1';
const SESSION_KEY = 'ledger.session.v1';

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const d = raw ? JSON.parse(raw) : null;
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function hashPassword(password: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toB64(bits);
}

const pub = ({ id, name, email, createdAt }: StoredUser): User => ({ id, name, email, createdAt });

// Single-account policy: once an account exists in this browser, sign-up closes.
export function signUpOpen(): boolean {
  return loadUsers().length === 0;
}

export function currentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s?.userId) return null;
    const u = loadUsers().find((x) => x.id === s.userId);
    return u ? pub(u) : null;
  } catch {
    return null;
  }
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const users = loadUsers();
  if (users.length > 0) {
    throw new Error('Account creation is closed — this device already has its account.');
  }
  const normalized = email.trim().toLowerCase();
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const user: StoredUser = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name.trim(),
    email: normalized,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: Date.now(),
  };
  saveUsers([...users, user]);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  return pub(user);
}

export async function signIn(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const user = loadUsers().find((u) => u.email === normalized);
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
    throw new Error('Email or password is incorrect.');
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  return pub(user);
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}
