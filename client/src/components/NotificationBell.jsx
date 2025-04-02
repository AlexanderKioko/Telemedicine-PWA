"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';

export default function NotificationBell() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/notifications', {
        withCredentials: true
      });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-read', {}, {
        withCredentials: true
      });
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          markAsRead();
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {isLoading ? (
          <CircularProgress />
        ) : (
          <List sx={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText primary="No notifications" />
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <ListItem key={notification.id} divider>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography component="span" display="block">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </Popover>
    </>
  );
}