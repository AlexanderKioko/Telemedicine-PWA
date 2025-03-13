import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get all appointments (Doctor/Admin)
export const getAppointments = async (token: string) => {
  try {
    const res = await axios.get(`${API_URL}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

// Book an appointment (Patient)
export const bookAppointment = async (token: string, patientId: string, doctorId: string) => {
  try {
    const res = await axios.post(
      `${API_URL}/appointments`,
      { patientId, doctorId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    console.error("Error booking appointment:", error);
    return null;
  }
};

// Update appointment status (Doctor/Admin)
export const updateAppointmentStatus = async (token: string, appointmentId: string, status: string) => {
  try {
    const res = await axios.put(
      `${API_URL}/appointments/${appointmentId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating appointment:", error);
    return null;
  }
};