"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CircularProgress, Container, Typography } from "@mui/material";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }

    // Redirect based on user role
    switch (user.role) {
      case "PATIENT":
        router.push("/dashboard/patient");
        break;
      case "DOCTOR":
        router.push("/dashboard/doctor");
        break;
      case "ADMIN":
        router.push("/dashboard/admin");
        break;
      default:
        router.push("/login"); // Redirect to login if role is unknown
    }
  }, [user, router]);

  return (
    <Container sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h5">Redirecting...</Typography>
      <CircularProgress sx={{ mt: 2 }} />
    </Container>
  );
}