"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Container, Typography, Button, Card, CardContent } from "@mui/material";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return <p>Loading...</p>;

  return (
    <Container maxWidth="md" sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Welcome, {user.name} (Administrator)
      </Typography>

      <Card sx={{ mt: 3, p: 2, bgcolor: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="body1">You can manage users, appointments, and platform settings.</Typography>
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

export default AdminDashboard;