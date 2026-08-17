import { createContext, useContext, useState, type ReactNode } from 'react';
import { findRetailerByEmail } from '../data/retailers';

export type Portal = 'admin' | 'retailer';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  portal: Portal;
  storeId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, remember?: boolean, portal?: Portal) => AuthUser;
  signup: (name: string, email: string, loginId: string) => AuthUser;
  logout: () => void;
}

const STORAGE_KEY = 'pharmanexus-auth';
const DEMO_ADMIN: AuthUser = {
  name: 'Anita Sharma',
  email: 'anita.sharma@pharmanexus.in',
  role: 'Procurement Manager',
  portal: 'admin',
};
const DEMO_RETAILER: AuthUser = {
  name: 'Rahul Mehta',
  email: 'rahul@carepluspharmacy.in',
  role: 'Store Owner',
  portal: 'retailer',
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.email) return null;
    return {
      name: parsed.name ?? 'User',
      email: parsed.email,
      role: parsed.role ?? 'Member',
      portal: parsed.portal ?? 'admin',
      storeId: parsed.storeId,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const persist = (u: AuthUser, remember: boolean) => {
    setUser(u);
    if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const login = (email: string, _password: string, remember = true, portal: Portal = 'admin'): AuthUser => {
    const demo = portal === 'retailer' ? DEMO_RETAILER : DEMO_ADMIN;
    const retailer = portal === 'retailer' ? findRetailerByEmail(email || demo.email) : undefined;
    const name = retailer
      ? retailer.contact.fullName
      : email && email !== demo.email
        ? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : demo.name;
    const u: AuthUser = {
      name,
      email: email || demo.email,
      role: demo.role,
      portal,
      storeId: retailer?.id,
    };
    persist(u, remember);
    return u;
  };

  const signup = (name: string, email: string, loginId: string): AuthUser => {
    const u: AuthUser = { name, email: email || `${loginId}@pharmanexus.in`, role: 'Procurement Manager', portal: 'admin' };
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
