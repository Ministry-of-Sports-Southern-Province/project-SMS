import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  preferredLang?: string;
  darkMode?: boolean;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'sms_token';
const USER_KEY = 'sms_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      setToken(t);
      try {
        setUserState(JSON.parse(u));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'A',location:'AuthContext.tsx:login',message:'login attempt start',data:{username,origin:window.location.origin,port:window.location.port,href:window.location.href},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    // #region agent log
    fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'A',location:'AuthContext.tsx:login:response',message:'login fetch response',data:{ok:res.ok,status:res.status,statusText:res.statusText,url:res.url},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // #region agent log
      fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'B',location:'AuthContext.tsx:login:error',message:'login failed',data:{status:res.status,error:data.error||null,errors:data.errors||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    // #region agent log
    fetch('http://127.0.0.1:7935/ingest/419cad35-8db2-43a6-a3d6-91a89eeb3d18',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc5c8f'},body:JSON.stringify({sessionId:'fc5c8f',runId:'pre-fix',hypothesisId:'C',location:'AuthContext.tsx:login:success',message:'login success',data:{userId:data.user?.id,username:data.user?.username,role:data.user?.role},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setToken(data.token);
    const u = {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.displayName,
      role: data.user.role,
      preferredLang: data.user.preferredLang,
      darkMode: data.user.darkMode,
      profilePicture: data.user.profilePicture,
    };
    setUserState(u);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
