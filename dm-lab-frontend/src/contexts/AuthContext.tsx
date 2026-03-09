import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@/types/api";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("dmlab_token"));
  const [isLoading, setIsLoading] = useState(!!token);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("dmlab_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("dmlab_token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        logout();
      })
      .finally(() => setIsLoading(false));
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
