"use client";
import { Drawer, List, ListItemButton, ListItemText, ListItemIcon, Box, Divider } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from './NotificationBell'; // Import the NotificationBell component

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <Drawer anchor="left" open={isOpen} onClose={toggleSidebar}>
      <Box sx={{ width: 250, bgcolor: "#f4f4f4", height: "100vh" }}>
        <List>
          {/* NotificationBell without navigation */}
          <ListItemButton>
            <ListItemIcon>
              <NotificationBell />
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>

          {/* Removed - no dedicated notifications page exists */}
        </List>
        <Divider />
        {user && (
          <List>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        )}
      </Box>
    </Drawer>
  );
}