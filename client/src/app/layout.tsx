"use client"; // Ensure this file runs on the client side

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext"; // Add useAuth import
import { ReactNode } from "react";

// Creates a QueryClient instance
const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Wraps entire app with AuthProvider so Navbar gets context */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TabSyncHandler /> {/* Add this new component */}
            <Navbar /> {/* Now Navbar is inside AuthProvider */}
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

// New component for handling tab synchronization
function TabSyncHandler() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'token' || event.key === 'user') {
        await checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  return null;
}