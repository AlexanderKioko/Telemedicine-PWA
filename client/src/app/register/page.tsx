"use client";
import { useState } from "react";
import {
  TextField, Button, Container, Typography, Box,
  CircularProgress, MenuItem, IconButton, InputAdornment, Alert
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import Link from 'next/link';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: "PATIENT" | "DOCTOR";
  gender: "MALE" | "FEMALE" | "OTHER";
  nationalId: string;
}

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  role: yup.string().oneOf(["PATIENT", "DOCTOR"], "Invalid role").required("Role is required"),
  gender: yup.string().oneOf(["MALE", "FEMALE", "OTHER"], "Invalid gender").required("Gender is required"),
  nationalId: yup.string().required("National ID is required"),
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "PATIENT",
      gender: "MALE",
      nationalId: ""
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await axios.post('/api/register', data, {
        withCredentials: true // Add this
      });

      // Redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      let errorMessage = "Registration failed. Please try again.";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error ||
                      err.response?.data?.message ||
                      err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 8,
        minHeight: "70vh"
      }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create an Account
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Sign up to get started
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: "100%", mt: 3 }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Role"
                select
                fullWidth
                margin="normal"
                error={!!errors.role}
                helperText={errors.role?.message}
                disabled={isSubmitting}
              >
                <MenuItem value="PATIENT">Patient</MenuItem>
                <MenuItem value="DOCTOR">Doctor</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Gender"
                select
                fullWidth
                margin="normal"
                error={!!errors.gender}
                helperText={errors.gender?.message}
                disabled={isSubmitting}
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="nationalId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="National ID"
                fullWidth
                margin="normal"
                error={!!errors.nationalId}
                helperText={errors.nationalId?.message}
                disabled={isSubmitting}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, py: 1.5 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : "Register"}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" style={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}>
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}