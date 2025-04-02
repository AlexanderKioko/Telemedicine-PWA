"use client";
import { AppBar, Toolbar, Typography, Button, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Sidebar from "./Sidebar"; // Import Sidebar

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar State

  // Toggle Sidebar Function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get Dashboard Route Based on User Role
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
    <>
      {/* Navbar */}
      <AppBar position="static" sx={{ backgroundColor: "#1976D2" }}>
        <Toolbar>
          {/* Menu Button for Sidebar */}
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            MediReach
          </Typography>

          {/* Conditional Rendering for Authenticated Users */}
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

      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </>
  );
}