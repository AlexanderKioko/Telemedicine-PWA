"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Container, Typography, Button, Card, CardContent } from "@mui/material";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return <p>Loading...</p>;

  return (
    <Container maxWidth="md" sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Welcome, Dr. {user.name}!
      </Typography>

      <Card sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5" }}>
        <CardContent>
          <Typography variant="body1">You can manage your appointments and consult patients.</Typography>
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
};

export default DoctorDashboard;
