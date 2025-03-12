"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Define the authentication context type
interface AuthContextType {
  user: { id: number; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const router = useRouter();

  // Check if user is already logged in (on page refresh)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: userData.id, role: userData.role });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
      }
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, { email, password });

      localStorage.setItem("token", res.data.token);
      setUser({ id: res.data.id, role: res.data.role });

      router.push("/dashboard"); // Redirect to dashboard after login
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed. Check your credentials.");
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/"); // Redirect to home after logout
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

// Hook to use authentication
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};