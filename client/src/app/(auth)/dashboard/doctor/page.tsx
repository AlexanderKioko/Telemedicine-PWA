"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAppointmentsForDoctor, updateAppointmentStatus } from "@/api/appointments";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  AlertColor,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import Sidebar from "../../../../components/Sidebar";
import Footer from "../../../../components/Footer";
import RouteGuard from "@/components/RouteGuard";
import { formatTimeForDisplay, formatDateForDisplay } from '@/utils/timeService';

interface IPatient {
  id: string;
  name: string;
  email?: string;
}

interface IDoctorAppointment {
  id: string;
  date: string;
  status: string;
  patient?: IPatient;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<IDoctorAppointment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      router.push("/login");
    }
  }, [user, router]);

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await getAppointmentsForDoctor();
      setAppointments(data);
    } catch (error) {
      console.error("Error loading doctor's appointments:", error);
      showNotification("Failed to load your appointments.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleUpdateAppointment = async (appointmentId: string, newStatus: "confirmed" | "canceled") => {
    try {
      const updated = await updateAppointmentStatus(appointmentId, newStatus);
      if (updated) {
        showNotification(`Appointment ${newStatus} successfully!`, "success");
        loadAppointments();
      } else {
        showNotification("Failed to update appointment.", "error");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      showNotification("Error updating appointment. Please try again.", "error");
    }
  };

  const handleJoinVideoCall = async (appointmentId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-room-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) throw new Error('Failed to generate token');

      const { roomToken } = await response.json();
      window.location.href = `/video-call?roomToken=${roomToken}`;
    } catch (error) {
      console.error('Error joining call:', error);
      showNotification("Failed to start video call", "error");
    }
  };

  const showNotification = (message: string, severity: AlertColor) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <RouteGuard allowedRoles={['DOCTOR']}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", flex: 1, overflowY: "auto" }}>
          <Sidebar isOpen={sidebarOpen} toggleSidebar={handleSidebarToggle} />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: "#f9f9f9",
              p: 3,
              transition: "margin 0.3s ease-in-out",
              marginLeft: sidebarOpen ? "250px" : "0",
            }}
          >
            <Container maxWidth="lg">
              <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
                <Box sx={{
                  bgcolor: "primary.main",
                  p: 2,
                  color: "white",
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h5">Doctor Dashboard</Typography>
                  <Tooltip title="Refresh data">
                    <IconButton
                      color="inherit"
                      onClick={loadAppointments}
                      disabled={isLoading}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.light", mx: "auto", mb: 2 }}>
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6">Welcome, Dr. {user?.name || "Doctor"}!</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your appointments, approve/reject requests, and more.
                  </Typography>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <Box sx={{ bgcolor: "secondary.light", p: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Your Appointments</Typography>
                </Box>
                <CardContent>
                  {isLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : appointments.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: "center", color: "gray" }}>
                      No appointments found.
                    </Typography>
                  ) : (
                    <List>
                      {appointments.map((appt) => {
                        const formattedDate = formatDateForDisplay(appt.date);
                        const formattedTime = formatTimeForDisplay(appt.date);

                        return (
                          <Box key={appt.id}>
                            <ListItem>
                              <ListItemText
                                primary={`Patient: ${appt.patient?.name || "Unknown"}`}
                                secondary={
                                  <>
                                    <Typography component="span" display="block">
                                      Date: {formattedDate}
                                    </Typography>
                                    <Typography component="span" display="block">
                                      Time: {formattedTime} (EAT)
                                    </Typography>
                                    <Typography component="span" display="block">
                                      Status: {appt.status}
                                    </Typography>
                                  </>
                                }
                              />
                              {appt.status === "pending" && (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleUpdateAppointment(appt.id, "confirmed")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleUpdateAppointment(appt.id, "canceled")}
                                  >
                                    Reject
                                  </Button>
                                </Box>
                              )}
                              {appt.status === "confirmed" && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleJoinVideoCall(appt.id)}
                                >
                                  Join Video Call
                                </Button>
                              )}
                            </ListItem>
                            <Divider />
                          </Box>
                        );
                      })}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Container>
          </Box>
        </Box>

        <Footer />

        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </RouteGuard>
  );
}