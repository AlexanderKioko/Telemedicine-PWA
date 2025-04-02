import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Enhanced interfaces
export interface AdminStats {
  totalUsers: number;
  activeDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  userGrowth?: { date: string; count: number }[];
  appointmentTrends?: { date: string; count: number }[];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  gender: "MALE" | "FEMALE" | "OTHER";
  nationalId: string;
  available: boolean;
  createdAt: string;
  refreshToken?: string;
}

export interface AdminAppointment {
  id: string;
  date: string; // Full ISO datetime
  status: string;
  patient?: { id: string; name: string };
  doctor?: { id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// SafeAdminAppointment interface for strict type safety
export interface SafeAdminAppointment extends AdminAppointment {
  patientId: string;
  doctorId: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Export-specific interfaces
interface ExportUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ExportAppointment {
  id: string;
  date: string;
  status: string;
  patient: { id: string; name: string };
  doctor: { id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Centralized error handler
const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    const message = error.response?.data?.error ||
                    error.message ||
                    defaultMessage;
    throw new Error(`${message} (Status: ${error.response?.status})`);
  } else {
    console.error('Non-Axios Error:', error);
    throw new Error(defaultMessage);
  }
};

// Get system statistics with analytics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const res = await axios.get<AdminStats>(`${API_URL}/api/admin/stats`, {
      withCredentials: true
    });
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to fetch admin statistics");
  }
};

// Get paginated users
export const getAllUsers = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SystemUser>> => {
  try {
    const res = await axios.get<PaginatedResponse<SystemUser>>(
      `${API_URL}/api/admin/users`,
      {
        params: { page, limit: pageSize },
        withCredentials: true
      }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to fetch users");
  }
};

// Update user role
export const updateUserRole = async (
  userId: string,
  role: "PATIENT" | "DOCTOR" | "ADMIN"
): Promise<SystemUser> => {
  try {
    const res = await axios.put<SystemUser>(
      `${API_URL}/api/admin/users/${userId}/role`,
      { role },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to update user role");
  }
};

// Delete a user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
      withCredentials: true
    });
  } catch (error) {
    return handleApiError(error, "Failed to delete user");
  }
};

// Validate date string
const isValidDateString = (dateStr: string) => !isNaN(new Date(dateStr).getTime());

// Get all appointments (admin view) with enhanced type safety
export const getAllAppointments = async (): Promise<SafeAdminAppointment[]> => {
  try {
    const res = await axios.get<AdminAppointment[]>(`${API_URL}/api/admin/appointments`, {
      withCredentials: true
    });

    return res.data.map(appt => {
      // Validate date - critical for admin dashboard
      let safeDate: string;
      try {
        const dateObj = new Date(appt.date);
        safeDate = isValidDateString(appt.date) ? dateObj.toISOString() : new Date().toISOString();
      } catch {
        safeDate = new Date().toISOString(); // Fallback to current time
      }

      return {
        ...appt,
        date: safeDate,
        patientId: appt.patient?.id || "",
        doctorId: appt.doctor?.id || "",
        patient: appt.patient || { id: "", name: "Unknown Patient" },
        doctor: appt.doctor || { id: "", name: "Unknown Doctor" },
      };
    });
  } catch (error) {
    console.error('Appointment fetch error:', error);
    return handleApiError(error, "Failed to fetch appointments");
  }
};

// Assign doctor to appointment
export const assignDoctorToAppointment = async (
  appointmentId: string,
  doctorId: string
): Promise<AdminAppointment> => {
  try {
    const res = await axios.put<AdminAppointment>(
      `${API_URL}/api/appointments/${appointmentId}/assign`,
      { doctorId },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to assign doctor");
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: "pending" | "confirmed" | "completed" | "canceled"
): Promise<AdminAppointment> => {
  try {
    const res = await axios.put<AdminAppointment>(
      `${API_URL}/api/appointments/${appointmentId}/status`,
      { status },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to update appointment status");
  }
};

// Create new user (for UserForm)
export const createUser = async (
  userData: Omit<SystemUser, "id" | "createdAt" | "refreshToken"> & { password: string }
): Promise<SystemUser> => {
  try {
    const res = await axios.post<SystemUser>(
      `${API_URL}/api/admin/users`,
      userData,
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to create user");
  }
};

// Safe export data (filtered fields)
export const getExportData = async (
  type: "users" | "appointments"
): Promise<ExportUser[] | ExportAppointment[]> => {
  try {
    const res = await axios.get<ExportUser[] | ExportAppointment[]>(
      `${API_URL}/api/admin/export/${type}`,
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return handleApiError(error, "Failed to export data");
  }
};