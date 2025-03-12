"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TextField, Button, Container, Typography, Box, CircularProgress } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// Define form data type
interface LoginForm {
  email: string;
  password: string;
}

// Form validation schema using Yup
const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Use react-hook-form with controlled components
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" }, // ✅ Prevents uncontrolled input errors
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    await login(data.email, data.password);
    setLoading(false);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 8 }}>
        <Typography variant="h4" fontWeight="bold">Welcome Back</Typography>
        <Typography variant="body2" color="textSecondary">Login to continue</Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: "100%", mt: 3 }}>
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
                helperText={errors.email?.message as string} 
                value={field.value || ""} // Ensures controlled input
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
                type="password" 
                fullWidth 
                margin="normal" 
                error={!!errors.password} 
                helperText={errors.password?.message as string} 
                value={field.value || ""} // Ensures controlled input
              />
            )}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}