"use client";
import { AppBar, Toolbar, Typography, Button, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
            <Button color="inherit" onClick={() => router.push("/dashboard")}>
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
