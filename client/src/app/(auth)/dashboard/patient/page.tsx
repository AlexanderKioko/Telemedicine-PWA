"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment, getAppointmentsForPatient, generateRoomToken } from "@/api/appointments";
import { getDoctors, type Doctor } from "@/api/doctors";
import {
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  TextField,
  Grid,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  AlertColor,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import Sidebar from "../../../../components/Sidebar";
import Footer from "../../../../components/Footer";
import RouteGuard from "@/components/RouteGuard";
import { formatTimeForDisplay, formatDateForDisplay } from '@/utils/timeService';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctor: Doctor;
  patient?: {
    id: string;
    name: string;
    email?: string;
  };
  date: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export default function PatientDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({
    doctors: true,
    appointments: true,
    booking: false
  });
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "success",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const loadDoctors = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, doctors: true }));
      const doctorList = await getDoctors();

      if (!doctorList || !Array.isArray(doctorList)) {
        throw new Error("Invalid doctors data received");
      }

      const normalizedDoctors = doctorList.map(doctor => ({
        id: doctor.id,
        name: doctor.name || "Unknown Doctor",
        email: doctor.email || "",
        available: doctor.available || false
      }));

      setDoctors(normalizedDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
      showNotification("Failed to load doctors.", "error");
      setDoctors([]);
    } finally {
      setIsLoading(prev => ({ ...prev, doctors: false }));
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, appointments: true }));
      const appointmentList = await getAppointmentsForPatient();

      if (!appointmentList || !Array.isArray(appointmentList)) {
        throw new Error("Invalid appointments data received");
      }

      const normalizedAppointments = appointmentList.map(appt => ({
        ...appt,
        doctor: {
          id: appt.doctor?.id || "",
          name: appt.doctor?.name || "Unknown Doctor",
          email: appt.doctor?.email || "",
          available: appt.doctor?.available || false
        },
        patient: appt.patient ? {
          id: appt.patient.id,
          name: appt.patient.name,
          email: appt.patient.email
        } : undefined
      }));

      setAppointments(normalizedAppointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      showNotification("Failed to load appointments.", "error");
      setAppointments([]);
    } finally {
      setIsLoading(prev => ({ ...prev, appointments: false }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadDoctors(), loadAppointments()]);
  }, [loadDoctors, loadAppointments]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated, refreshAll]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const MIN_ADVANCE_MINUTES = 5;

  const handleBookAppointment = async () => {
    if (!user?.id) {
      showNotification("Authentication required", "error");
      return;
    }

    const missingFields = [
      !selectedDoctor && "doctor",
      !appointmentDate && "date",
      !appointmentTime && "time"
    ].filter(Boolean);

    if (missingFields.length > 0) {
      showNotification(`Please select: ${missingFields.join(", ")}`, "error");
      return;
    }

    // Combine date and time into a local datetime string (EAT)
    const localDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();

    // Check if appointment is at least 5 minutes in the future
    if (localDateTime < new Date(now.getTime() + MIN_ADVANCE_MINUTES * 60000)) {
      showNotification("Appointments must be booked at least 5 minutes in advance", "error");
      return;
    }

    // Convert local datetime to UTC ISO string (correctly)
    const utcDateTime = localDateTime.toISOString();

    try {
      setIsLoading(prev => ({ ...prev, booking: true }));

      const result = await bookAppointment(
        selectedDoctor,
        utcDateTime
      );

      if (!result) {
        throw new Error("Booking failed - no data returned");
      }

      showNotification("Appointment booked successfully!", "success");
      setSelectedDoctor("");
      setAppointmentDate("");
      setAppointmentTime("");
      await loadAppointments();
    } catch (error) {
      console.error("Booking Error:", error);
      showNotification("Failed to book appointment. Please try again.", "error");
    } finally {
      setIsLoading(prev => ({ ...prev, booking: false }));
    }
  };

  const handleJoinVideoCall = async (appointmentId: string) => {
    try {
      const roomToken = await generateRoomToken(appointmentId);
      if (roomToken) {
        router.push(`/video-call?roomToken=${roomToken}`);
      } else {
        showNotification("Failed to generate room token.", "error");
      }
    } catch (error) {
      console.error("Error generating room token:", error);
      showNotification("Error generating room token. Please try again.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "success";
      case "pending": return "warning";
      case "canceled": return "error";
      case "completed": return "info";
      default: return "default";
    }
  };

  const showNotification = (message: string, severity: AlertColor) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <RouteGuard allowedRoles={['PATIENT']}>
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
                  <Typography variant="h5">Patient Dashboard</Typography>
                  <Tooltip title="Refresh data">
                    <IconButton
                      color="inherit"
                      onClick={refreshAll}
                      disabled={isLoading.doctors || isLoading.appointments}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <CardContent sx={{ textAlign: "center" }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.light", mx: "auto", mb: 2 }}>
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6">Welcome, {user?.name || "Patient"}!</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your healthcare appointments
                  </Typography>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                <Box sx={{ bgcolor: "primary.light", p: 2 }}>
                  <Typography variant="h6">
                    <CalendarTodayIcon sx={{ mr: 1 }} />
                    Book an Appointment
                  </Typography>
                </Box>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Select Doctor</InputLabel>
                        <Select
                          value={selectedDoctor}
                          onChange={(e) => setSelectedDoctor(e.target.value)}
                          label="Select Doctor"
                          disabled={isLoading.doctors}
                        >
                          <MenuItem value="">
                            <em>Select a doctor</em>
                          </MenuItem>
                          {doctors.map((doctor) => (
                            <MenuItem
                              key={doctor.id}
                              value={doctor.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>{doctor.name}</span>
                              <Chip
                                label={doctor.available ? "Available" : "Unavailable"}
                                size="small"
                                color={doctor.available ? "success" : "error"}
                                sx={{ ml: 1 }}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Appointment Date"
                        type="date"
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        inputProps={{ min: today }}
                        disabled={isLoading.doctors}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Appointment Time"
                        type="time"
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        inputProps={{
                          step: 300, // 5-minute intervals
                        }}
                        disabled={isLoading.doctors}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={handleBookAppointment}
                        disabled={
                          isLoading.doctors ||
                          isLoading.appointments ||
                          isLoading.booking
                        }
                        startIcon={
                          isLoading.booking ? <CircularProgress size={24} /> : null
                        }
                      >
                        {isLoading.booking ? "Processing..." : "Book Appointment"}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <Box sx={{ bgcolor: "secondary.light", p: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Your Appointments</Typography>
                </Box>
                <CardContent>
                  {isLoading.appointments ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : appointments.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ textAlign: "center", color: "gray" }}
                    >
                      No appointments booked yet.
                    </Typography>
                  ) : (
                    <List>
                      {appointments.map((appt) => (
                        <Box key={appt.id}>
                          <ListItem divider>
                            <ListItemText
                              primary={`Dr. ${appt.doctor.name}`}
                              secondary={
                                <>
                                  <Typography component="span" display="block">
                                    Date: {formatDateForDisplay(appt.date)}
                                  </Typography>
                                  <Typography component="span" display="block">
                                    Time: {formatTimeForDisplay(appt.date)} (EAT)
                                  </Typography>
                                  {appt.notes && (
                                    <Typography component="span" display="block" fontStyle="italic">
                                      Notes: {appt.notes}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                            <Chip
                              label={appt.status.toUpperCase()}
                              color={getStatusColor(appt.status)}
                              variant="outlined"
                              sx={{ ml: 2 }}
                            />
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
                      ))}
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
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </RouteGuard>
  );
}