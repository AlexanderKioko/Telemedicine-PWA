"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Button, Card, CardContent } from "@mui/material";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "PATIENT") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return <p>Loading...</p>;

  return (
    <Container maxWidth="md" sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Patient Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Welcome, {user?.name || "Patient"}!
      </Typography>

      <Card sx={{ mt: 3, p: 2, bgcolor: "#f1f8e9" }}> {/* Light green for patient-friendly UI */}
        <CardContent>
          <Typography variant="body1">
            You can **schedule appointments**, consult doctors, and view prescriptions.
          </Typography>
        </CardContent>
      </Card>

      <Button 
        variant="contained" 
        color="error" 
        sx={{ mt: 3 }} 
        onClick={logout}
      >
        Logout
      </Button>
    </Container>
  );
}