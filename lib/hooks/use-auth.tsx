"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/db/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const data = await apiRequest<User>("/api/users/me");
      setUser(data);
    } catch (error: unknown) {
      // Try to refresh token
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const tokenData = await apiRequest<{
            access_token: string;
            refresh_token: string;
          }>("/api/auth/token/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          localStorage.setItem("access_token", tokenData.access_token);
          localStorage.setItem("refresh_token", tokenData.refresh_token);

          // Retry getting user
          const userData = await apiRequest<User>("/api/users/me");
          setUser(userData);
        } catch (refreshError: unknown) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
          throw refreshError;
        }
      } else {
        setUser(null);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (token) {
      refreshUser().catch(() => {
        // If refresh fails, clear tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    const data = await apiRequest<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email_or_username: emailOrUsername,
        password,
      }),
    });

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);

    // Redirect based on role
    // Small delay ensures React state update and context propagation
    setTimeout(() => {
      if (data.user.role === "admin") {
        router.replace("/admin-dashboard");
      } else {
        router.replace("/feed");
      }
    }, 50);
  };

  const register = async (registerData: RegisterData) => {
    const data = await apiRequest<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    router.push("/feed");
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      apiRequest("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }).catch(console.error);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
