"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CircularProgress, Container, Typography } from "@mui/material";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Early return if still loading
    
    if (!user) {
      router.push('/login');
      return;
    }

    const rolePath = user.role.toLowerCase();
    const validRoles = ['patient', 'doctor', 'admin'];
    
    if (!validRoles.includes(rolePath)) {
      console.error('Invalid user role:', user.role);
      router.push('/login');
      return;
    }

    router.push(`/dashboard/${rolePath}`);
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={80} />
      </Container>
    );
  }

  return (
    <Container sx={{
      textAlign: "center",
      mt: 5,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh"
    }}>
      <Typography variant="h5" gutterBottom>
        Redirecting to your dashboard...
      </Typography>
      <CircularProgress size={60} />
    </Container>
  );
}