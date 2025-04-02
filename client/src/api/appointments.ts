import axios from "axios";
import { jwtDecode } from 'jwt-decode'; // Changed from jsonwebtoken

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Doctor {
  id: string;
  name: string;
  email?: string;
  available: boolean;
}

interface Patient {
  id: string;
  name: string;
  email?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctor: Doctor;
  patient?: Patient;
  date: string; // UTC ISO string
  status: "pending" | "confirmed" | "canceled" | "completed";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JwtPayload {
  roomId: string;
  userId: string;
  role: string;
  exp: number; // Changed from 'expires' to 'exp' to match jwt-decode
}

// Get all appointments (for Admin view)
export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data } = await axios.get<Appointment[]>(`${API_URL}/api/admin/appointments`, {
      withCredentials: true
    });

    return data.map(appt => ({
      ...appt,
      date: appt.date, // Keep as UTC ISO string
    }));
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Get patient-specific appointments
export const getAppointmentsForPatient = async (): Promise<Appointment[]> => {
  try {
    const { data } = await axios.get<Appointment[]>(`${API_URL}/api/patient/appointments`, {
      withCredentials: true
    });

    return data.map(appt => ({
      ...appt,
      date: appt.date, // Keep as UTC ISO string
      doctor: appt.doctor || {
        id: "",
        name: "Unknown Doctor",
        available: false
      }
    }));
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Get doctor-specific appointments
export const getAppointmentsForDoctor = async (): Promise<Appointment[]> => {
  try {
    const { data } = await axios.get<Appointment[]>(`${API_URL}/api/doctor/appointments`, {
      withCredentials: true
    });

    return data.map(appt => ({
      ...appt,
      date: appt.date, // Keep as UTC ISO string
      patient: appt.patient || {
        id: "",
        name: "Unknown Patient"
      }
    }));
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Book an appointment
export const bookAppointment = async (
  doctorId: string,
  datetime: string, // UTC ISO string
  notes?: string
): Promise<Appointment | null> => {
  try {
    const { data } = await axios.post<Appointment>(
      `${API_URL}/api/appointments`,
      { doctorId, datetime, notes },
      {
        withCredentials: true
      }
    );
    return data;
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: "confirmed" | "canceled" | "completed" | "pending"
): Promise<Appointment | null> => {
  try {
    const { data } = await axios.put<Appointment>(
      `${API_URL}/api/appointments/${appointmentId}/status`,
      { status },
      {
        withCredentials: true
      }
    );
    return data;
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
  try {
    const { data } = await axios.put<Appointment>(
      `${API_URL}/api/appointments/${appointmentId}/status`,
      { status: "canceled" },
      {
        withCredentials: true
      }
    );
    return data.status === "canceled";
  } catch (error) {
    handleApiError(error);
    return false;
  }
};

// Generate room token for secure video call access
export const generateRoomToken = async (appointmentId: string): Promise<string | null> => {
  try {
    const { data } = await axios.post<{ roomToken: string }>(
      `${API_URL}/api/generate-room-token`,
      { appointmentId },
      {
        withCredentials: true
      }
    );
    return data.roomToken;
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

// Verify room token - BROWSER COMPATIBLE VERSION
export const verifyRoomToken = (token: string): { valid: boolean, roomId?: string } => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const now = Math.floor(Date.now() / 1000);

    // Note: jwt-decode doesn't verify the signature, so we need to:
    // 1. Either trust the token comes from a trusted source
    // 2. Or verify it through an API endpoint (recommended)

    if (decoded.exp && decoded.exp < now) {
      return { valid: false };
    }
    return { valid: true, roomId: decoded.roomId };
  } catch (error) {
    console.error("Token decoding failed:", error);
    return { valid: false };
  }
};

// Alternative (recommended): Move verification to API endpoint
export const verifyRoomTokenViaAPI = async (token: string): Promise<{ valid: boolean, roomId?: string }> => {
  try {
    const response = await axios.post(`${API_URL}/api/verify-room-token`, { token }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error("Token verification failed:", error);
    return { valid: false };
  }
};

// Updated error handler
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      window.location.href = '/login?session_expired=true';
    }
    if (error.response?.status === 403) {
      window.location.href = '/login?unauthorized=true';
    }
    console.error("API Error:", error.response?.data?.message || error.message);
  }
};