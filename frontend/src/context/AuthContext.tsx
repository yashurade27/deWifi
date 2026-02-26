import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "owner";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "user" | "owner";
}

interface SigninPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

interface AuthContextValue extends AuthState {
  signup: (payload: SignupPayload) => Promise<void>;
  signin: (payload: SigninPayload) => Promise<void>;
  signout: () => Promise<void>;
  isAuthenticated: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "dewifi_token";
const USER_KEY = "dewifi_user";

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = localStorage.getItem(USER_KEY);
      return { token, user: user ? JSON.parse(user) : null };
    } catch {
      return { token: null, user: null };
    }
  });

  const persist = (token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ token, user });
  };

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: null, user: null });
  };

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: payload,
    });
    persist(res.token, res.user);
  }, []);

  const signin = useCallback(async (payload: SigninPayload) => {
    const res = await apiFetch<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: payload,
    });
    persist(res.token, res.user);
  }, []);

  const signout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/signout", {
        method: "POST",
        token: state.token ?? undefined,
      });
    } finally {
      clear();
    }
  }, [state.token]);

  return (
    <AuthContext.Provider
      value={{ ...state, signup, signin, signout, isAuthenticated: !!state.token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
