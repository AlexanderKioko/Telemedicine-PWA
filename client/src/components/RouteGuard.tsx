"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircularProgress } from "@mui/material"; // Import CircularProgress

export default function RouteGuard({ allowedRoles, children }: {
  allowedRoles: ('PATIENT' | 'DOCTOR' | 'ADMIN')[],
  children: React.ReactNode
}) {
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role)) {
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      }
    }
  }, [user, loading, allowedRoles, router]);

  // Add session synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'logout') checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return <>{children}</>;
}