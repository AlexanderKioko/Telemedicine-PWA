"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TextField, Button, Container, Typography, Box, CircularProgress, MenuItem } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// Define form data type
interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: "PATIENT" | "DOCTOR";
}

// Form validation schema using Yup
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  role: yup.string().oneOf(["PATIENT", "DOCTOR"], "Invalid role").required("Role is required"),
});

export default function Register() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Use react-hook-form with controlled components
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "PATIENT" }, // ✅ Prevents uncontrolled input errors
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      // Log in immediately after successful registration
      await login(data.email, data.password);
    } catch (error) {
      console.error("Registration error:", error); // Fixes ESLint warning & logs for debugging
      alert("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 8 }}>
        <Typography variant="h4" fontWeight="bold">Create an Account</Typography>
        <Typography variant="body2" color="textSecondary">Sign up to get started</Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: "100%", mt: 3 }}>
          <Controller name="name" control={control} render={({ field }) => (
            <TextField 
              {...field} 
              label="Full Name" 
              fullWidth 
              margin="normal" 
              error={!!errors.name} 
              helperText={errors.name?.message as string} 
              value={field.value || ""} // Ensures controlled input
            />
          )} />
          
          <Controller name="email" control={control} render={({ field }) => (
            <TextField 
              {...field} 
              label="Email" 
              fullWidth 
              margin="normal" 
              error={!!errors.email} 
              helperText={errors.email?.message as string} 
              value={field.value || ""} // Ensures controlled input
            />
          )} />

          <Controller name="password" control={control} render={({ field }) => (
            <TextField 
              {...field} 
              label="Password" 
              type="password" 
              fullWidth 
              margin="normal" 
              error={!!errors.password} 
              helperText={errors.password?.message as string} 
              value={field.value || ""} // Ensures controlled input
            />
          )} />

          <Controller name="role" control={control} render={({ field }) => (
            <TextField 
              {...field} 
              label="Role" 
              select 
              fullWidth 
              margin="normal" 
              error={!!errors.role} 
              helperText={errors.role?.message as string}
              value={field.value || "PATIENT"} // Ensures controlled input
            >
              <MenuItem value="PATIENT">Patient</MenuItem>
              <MenuItem value="DOCTOR">Doctor</MenuItem>
            </TextField>
          )} />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Register"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}