import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { createUser } from '@/api/admin';
import type { SystemUser } from '@/api/admin';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Omit<SystemUser, 'id' | 'createdAt'> & { password?: string };
}

const UserForm: React.FC<UserFormProps> = ({ open, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState<
    Omit<SystemUser, 'id' | 'createdAt'> & { password: string }
  >({
    name: '',
    email: '',
    role: 'PATIENT',
    gender: 'MALE',
    nationalId: '',
    available: false,
    password: '',
    ...initialData,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createUser({
        ...formData,
        password: formData.password || '', // Ensure password is string
        available: formData.role === 'DOCTOR' // Auto-set availability for doctors
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit User' : 'Create User'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            type="email"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleSelectChange}
              label="Role"
            >
              <MenuItem value="PATIENT">Patient</MenuItem>
              <MenuItem value="DOCTOR">Doctor</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              onChange={handleSelectChange}
              label="Gender"
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            name="nationalId"
            label="National ID"
            value={formData.nationalId}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />

          {!initialData && (
            <TextField
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="password"
              inputProps={{ minLength: 6 }}
              helperText="Minimum 6 characters"
            />
          )}

          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Processing...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;