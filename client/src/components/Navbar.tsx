"use client";
import { AppBar, Toolbar, Typography, Button, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Function to determine the dashboard route based on user role
  const getDashboardRoute = () => {
    switch (user?.role) {
      case "PATIENT":
        return "/dashboard/patient";
      case "DOCTOR":
        return "/dashboard/doctor";
      case "ADMIN":
        return "/dashboard/admin";
      default:
        return "/dashboard";
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1976D2" }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          MediReach
        </Typography>

        {user ? (
          <>
            <Button color="inherit" onClick={() => router.push(getDashboardRoute())}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button color="inherit" onClick={() => router.push("/register")}>
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}