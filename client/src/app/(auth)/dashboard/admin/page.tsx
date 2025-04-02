"use client";
import { useEffect, useState, useCallback } from "react";
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "@/api/admin";
import type { AdminStats, SystemUser as User } from "@/api/admin";

import {
  Container,
  Typography,
  Card,
  Box,
  Alert,
  Snackbar,
  AlertColor,
  Divider,
  Grid,
  Tabs,
  Tab,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import {
  People,
  BarChart as MuiBarChart,
  Delete,
  Search,
  Add,
  Download,
} from "@mui/icons-material";
import Sidebar from "../../../../components/Sidebar";
import Footer from "../../../../components/Footer";
import RouteGuard from "@/components/RouteGuard";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import UserForm from "../../../../components/UserForm";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ message: string; severity: AlertColor; action?: React.ReactNode } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedUsers = searchTerm ? filteredUsers : users;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        getAdminStats(),
        getAllUsers(paginationModel.page + 1, paginationModel.pageSize),
      ]);
      setStats(statsData);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      showNotification("Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [paginationModel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (message: string, severity: AlertColor, action?: React.ReactNode) => {
    setNotification({ message, severity, action });
    setTimeout(() => setNotification(null), 3000);
  };

  const statsCards = (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <People sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <div>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h4">{stats?.totalUsers || 0}</Typography>
              </div>
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <People sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
              <div>
                <Typography variant="h6">Active Doctors</Typography>
                <Typography variant="h4">{stats?.activeDoctors || 0}</Typography>
              </div>
            </Box>
          </Box>
        </Card>
      </Grid>
    </Grid>
  );

  const userColumns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "role",
      headerName: "Role",
      renderCell: (params: GridRenderCellParams<User>) => {
        const userRow = params.row;
        return (
          <Select
            value={userRow.role}
            onChange={async (e) => {
              try {
                await updateUserRole(
                  userRow.id,
                  e.target.value as "PATIENT" | "DOCTOR" | "ADMIN"
                );
                loadData();
                showNotification("User role updated successfully!", "success");
              } catch {
                showNotification("Failed to update role. Please try again.", "error");
              }
            }}
          >
            <MenuItem value="PATIENT">Patient</MenuItem>
            <MenuItem value="DOCTOR">Doctor</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params: GridRenderCellParams<User>) => {
        const userRow = params.row;
        return (
          <>
            <IconButton
              onClick={async () => {
                try {
                  await deleteUser(userRow.id);
                  loadData();
                  showNotification("User deleted successfully!", "success");
                } catch {
                  showNotification("Failed to delete user. Please try again.", "error");
                }
              }}
            >
              <Delete color="error" />
            </IconButton>
            <Button
              variant="contained"
              onClick={() => setShowUserForm(true)}
              startIcon={<Add />}
            >
              New User
            </Button>
          </>
        );
      },
    },
  ];

  const analyticsData = stats
    ? [
        { name: "Total Users", value: stats.totalUsers },
        { name: "Active Doctors", value: stats.activeDoctors },
      ]
    : [];

  const exportData = () => {
    const csvContent = convertToCSV(users);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-export-${new Date().toISOString()}.csv`;
    link.click();
  };

  const convertToCSV = (data: User[]) => {
    if (data.length === 0) return "";
    const safeKeys = Object.keys(data[0]).filter(k => !['password', 'refreshToken'].includes(k)) as (keyof User)[];
    const headers = safeKeys.join(',');
    const rows = data.map(row => safeKeys.map(k => row[k]).join(',')).join('\n');
    return `${headers}\n${rows}`;
  };

  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", flex: 1, overflowY: "auto" }}>
          <Sidebar isOpen={false} toggleSidebar={() => {}} />

          <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "#f9f9f9", pb: 10 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 }, overflowX: 'auto' }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                  Admin Dashboard
                </Typography>
                <Divider />
              </Box>

              <TextField
                fullWidth
                variant="outlined"
                label="Search"
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {statsCards}

              <Tabs
                value={tabValue}
                onChange={(_event, newValue) => setTabValue(newValue)}
              >
                <Tab label="User Management" icon={<People />} />
                <Tab label="Analytics" icon={<MuiBarChart />} />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {tabValue === 0 && (
                      <>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={exportData}
                          >
                            Export CSV
                          </Button>
                        </Box>
                        <DataGrid
                          rows={displayedUsers}
                          columns={userColumns}
                          pagination
                          paginationMode="client"
                          pageSizeOptions={[5, 10, 25]}
                          initialState={{
                            pagination: {
                              paginationModel: paginationModel
                            }
                          }}
                          onPaginationModelChange={setPaginationModel}
                          disableRowSelectionOnClick
                          loading={loading}
                        />
                      </>
                    )}

                    {tabValue === 1 && (
                      <Card elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          System Analytics
                        </Typography>
                        <Tabs value={analyticsTab} onChange={(e, v) => setAnalyticsTab(v)}>
                          <Tab label="Overview" />
                          <Tab label="User Growth" />
                        </Tabs>

                        {analyticsTab === 0 && (
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={analyticsData}>
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}

                        {analyticsTab === 1 && (
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={stats?.userGrowth || []}>
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#8884d8" />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </Card>
                    )}
                  </>
                )}
              </Box>
            </Container>
          </Box>
        </Box>

        {notification && (
          <Snackbar open={true} autoHideDuration={3000}>
            <Alert severity={notification.severity}>
              {notification.message}
            </Alert>
          </Snackbar>
        )}

        {showUserForm && (
          <UserForm
            open={showUserForm}
            onClose={() => setShowUserForm(false)}
            onSuccess={() => {
              loadData();
              setShowUserForm(false);
            }}
          />
        )}

        <Footer />
      </Box>
    </RouteGuard>
  );
}