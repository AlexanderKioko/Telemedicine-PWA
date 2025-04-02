"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  TextField, Button, Container, Typography, Box,
  CircularProgress, Link, IconButton, InputAdornment, Alert
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

interface LoginForm {
  email: string;
  password: string;
}

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      // Remove token from local storage if it exists
      localStorage.removeItem('token');
      // Set login timestamp in localStorage upon successful login
      localStorage.setItem('login', Date.now().toString());
    } catch (err: unknown) {
      let errorMessage = "Login failed. Please check your credentials.";
      if (axios.isAxiosError(err)) {
        // Align with authContext's error handling
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
          Welcome Back
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Login to continue
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
                autoComplete="email"
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
                autoComplete="current-password"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label="toggle password visibility"
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Link href="/forgot-password" variant="body2" sx={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}>
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, py: 1.5 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : "Login"}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don&apos;t have an account?{' '}
              <Link href="/register" fontWeight="medium" sx={{ pointerEvents: isSubmitting ? 'none' : 'auto' }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}