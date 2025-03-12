"use client"; // Ensure this file runs on the client side

import Navbar from "@/components/Navbar";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
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
            <Navbar /> {/* Now Navbar is inside AuthProvider */}
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}