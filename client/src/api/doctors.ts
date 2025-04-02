import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  available: boolean;
  createdAt?: string;
}

/**
 * Fetches all available doctors
 * @returns Promise<Doctor[]> - Array of available doctors
 */
export const getDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data } = await axios.get<Doctor[]>(`${API_URL}/api/doctors`, {
      withCredentials: true, // Cookies auto-sent
      timeout: 10000
    });

    return data.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      available: doctor.available,
      createdAt: doctor.createdAt
    }));
  } catch (error) {
    handleApiError(error, "fetching doctors");
    return [];
  }
};

/**
 * Get doctor by ID
 * @param id - Doctor ID
 * @returns Promise<Doctor | null>
 */
export const getDoctorById = async (id: string): Promise<Doctor | null> => {
  try {
    const { data } = await axios.get<Doctor>(`${API_URL}/api/doctors/${id}`, {
      withCredentials: true // Cookies auto-sent
    });
    return data;
  } catch (error) {
    handleApiError(error, `fetching doctor ${id}`);
    return null;
  }
};

// Shared error handler
const handleApiError = (error: unknown, context: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const errorMessage = axiosError.response?.data?.message || axiosError.message;
  console.error(`Error ${context}:`, errorMessage);

  // Auto-logout on 401
  if (axiosError.response?.status === 401) {
    window.location.href = '/login?session_expired=true';
  }
};