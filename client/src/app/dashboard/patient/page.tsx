"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Button } from "@mui/material";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "PATIENT") router.push("/login");
  }, [user, router]);

  return (
    <Container>
      <Typography variant="h4">Patient Dashboard</Typography>
      <Typography>Welcome, {user?.name || "Patient"}!</Typography> {/* Ensure name is displayed */}
      <Button onClick={logout} variant="contained" color="error">
        Logout
      </Button>
    </Container>
  );
}