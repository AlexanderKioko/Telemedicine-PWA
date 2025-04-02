"use client";
import { createContext, useState, useEffect, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import api, { AxiosError } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Define a type for the error response data
interface ErrorResponse {
  error?: string;
  message?: string;
  detail?: string;
}

const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError === true;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await api.post('/api/logout');
    setUser(null);
    router.push('/login');
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<{ user: User }>('/api/login', { email, password });
      setUser(data.user);
      router.push(`/dashboard/${data.user.role.toLowerCase()}`);
    } catch (error) {
      console.error("Login Error:", error);
      let errorMessage = "Login failed. Please check your credentials.";

      if (isAxiosError(error)) {
        if (error.response) {
          const responseData = error.response.data as ErrorResponse;

          // Handle different response structures
          if (typeof responseData === 'string') {
            errorMessage = responseData;
          } else if (responseData) {
            errorMessage = responseData.error || responseData.message || responseData.detail || error.message;
          }

          if (error.response.status === 401) {
            await handleLogout();
          }
        } else {
          errorMessage = error.message || "Network error";
        }
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router, handleLogout]);

  const verifyToken = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await api.get<{ valid: boolean; user?: User }>('/api/verify-token');

      if (data.valid && data.user) {
        setUser(data.user);
        return true;
      }

      await handleLogout();
      return false;
    } catch (error) {
      if (isAxiosError(error)) {
        await handleLogout();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    let mounted = true;

    const checkAuthOnLoad = async () => {
      try {
        const { data } = await api.get<{ valid: boolean; user?: User }>('/api/verify-token');

        if (mounted) {
          if (data.valid && data.user) {
            setUser(data.user);
          } else {
            await handleLogout();
          }
        }
      } catch (error) {
        if (mounted && isAxiosError(error)) {
          await handleLogout();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuthOnLoad();

    return () => {
      mounted = false;
    };
  }, [handleLogout]);

  const contextValue = useMemo(() => ({
    user,
    login,
    logout: handleLogout,
    isAuthenticated: !!user,
    loading,
    checkAuth: verifyToken
  }), [user, login, handleLogout, loading, verifyToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};