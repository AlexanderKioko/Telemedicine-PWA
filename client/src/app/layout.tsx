"use client"; // Convert to Client Component

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
        {/* Navbar is included globally */}
        <Navbar />

        {/* Wrapping app with QueryClientProvider & AuthProvider */}
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}