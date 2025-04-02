const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const NodeCache = require("node-cache");
const { ExpressPeerServer } = require('peer');
const cron = require('node-cron');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const statsCache = new NodeCache({ stdTTL: 1800 }); // Cache for 30 minutes

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString(); };

// Verify Database Connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection error:', err));

// Centralized Error Handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Update CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'], // ✅ Add PUT and DELETE here
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(helmet()); // Security headers

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Admin Rate Limiting
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many admin requests, please try again later"
});
app.use('/api/admin/*', adminLimiter);

// Audit Logging Middleware
app.use('/api/admin/*', (req, res, next) => {
  console.log(`[ADMIN] ${req.user?.email} ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.1.0"
  });
});

// Database Health Check Endpoint
app.get('/api/db-health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ healthy: true, userCount });
  } catch (err) {
    res.status(500).json({ healthy: false, error: err.message });
  }
});

// Test Endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is operational",
    version: "1.1.0",
    features: ["RBAC", "Telemedicine", "LowBandwidth"]
  });
});

// Enhanced Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true }
    });

    if (!user) throw new Error("User not found");
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("token");
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Strict Role Checking Middleware
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Insufficient privileges",
      requiredRole: roles,
      currentRole: req.user.role
    });
  }
  next();
};

// Enhanced Token Verification Endpoint
app.get("/api/verify-token", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      res.clearCookie("token");
      return res.json({ valid: false });
    }

    return res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.clearCookie("token");
    return res.json({ valid: false });
  }
});

// User Registration
app.post(
  "/api/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/).withMessage("Password must be at least 8 characters, include an uppercase letter and a special character"),
    body("role").isIn(["PATIENT", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
    body("gender").isIn(["MALE", "FEMALE", "OTHER"]).withMessage("Invalid gender"),
    body("nationalId").notEmpty().withMessage("National ID is required")
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role, gender, nationalId } = req.body;

      // Check for existing user
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          gender,
          nationalId,
          available: role === "DOCTOR",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      res.status(201).json({
        message: "User registered successfully!",
        user: newUser
      });
    } catch (error) {
      next(new AppError("Failed to register user", 500));
    }
  }
);

// User Login (Optimized with improved cookie settings)
app.post(
  "/api/login",
  [
    body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    console.log('Login attempt received:', req.body.email); // Debug log

    try {
      const { email, password } = req.body;
      console.log('Looking for user:', email); // Debug log

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true, password: true }
      });

      if (!user) {
        console.log('User not found:', email); // Debug log
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log('User found, comparing password...'); // Debug log
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log('Invalid password for:', email); // Debug log
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Update refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Cookie security settings
      const cookieSettings = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600000 // 1 hour
      };

      // Set secure cookie with enhanced settings
      res.cookie("token", accessToken, cookieSettings);

      // Respond with user data
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error details:', { // Detailed error logging
        message: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error)
      });
      next(new AppError("Login failed", 500));
    }
  }
);

// Refresh Token (Optimized)
app.post("/api/refresh-token", async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    // Verify refresh token first
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Then find user
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        refreshToken
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Cookie security settings
    const cookieSettings = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600000 // 1 hour
    };

    // Set cookie with enhanced settings
    res.cookie("token", newAccessToken, cookieSettings);

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    next(new AppError("Invalid refresh token", 403));
  }
});

// Logout Implementation
app.post("/api/logout", async (req, res) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await prisma.user.update({
        where: { id: decoded.id },
        data: { refreshToken: null }
      });
    } catch (error) {
      // Token is invalid - we'll still clear the cookie
    }
  }

  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  return res.json({ success: true });
});

// Get Available Doctors (Enhanced)
app.get("/api/doctors", authenticateToken, async (req, res, next) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        available: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        available: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Cache control
    res.set('Cache-Control', 'public, max-age=300');

    res.json(doctors);
  } catch (error) {
    next(new AppError("Failed to fetch doctors", 500));
  }
});

// Get Doctor by ID (New Endpoint)
app.get("/api/doctors/:id", authenticateToken, async (req, res, next) => {
  try {
    const doctor = await prisma.user.findUnique({
      where: {
        id: req.params.id,
        role: "DOCTOR"
      },
      select: {
        id: true,
        name: true,
        email: true,
        available: true,
        createdAt: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    next(new AppError("Failed to fetch doctor", 500));
  }
});

// Book Appointment (Enhanced)
const MIN_ADVANCE_MS = 5 * 60 * 1000; // 5 minutes

app.post(
  "/api/appointments",
  authenticateToken,
  [
    body("doctorId").isString().notEmpty().withMessage("Doctor ID is required"),
    body("datetime").isISO8601().withMessage("Valid datetime is required"),
    body("notes").optional().isString().withMessage("Notes must be text")
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { doctorId, datetime, notes } = req.body;

      // Prevent accidental user ID in notes
      if (notes && notes === req.user.id) {
        return res.status(400).json({ error: "Invalid notes value" });
      }

      // Debug log to see what's received
      console.log("Raw datetime from client:", datetime);

      // Parse as UTC
      const appointmentDate = new Date(datetime);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({ error: "Invalid datetime format" });
      }

      // Debug log parsed date
      console.log("Parsed UTC datetime:", appointmentDate.toISOString());

      // Validate future date (UTC comparison)
      if (appointmentDate < new Date()) {
        return res.status(400).json({ error: "Appointment must be in the future" });
      }

      // 5-minute buffer validation
      if (appointmentDate - new Date() < MIN_ADVANCE_MS) {
        return res.status(400).json({
          error: "Appointments must be booked at least 5 minutes in advance"
        });
      }

      // Check existing appointments using UTC
      const existing = await prisma.appointment.findFirst({
        where: {
          doctorId,
          date: appointmentDate,
          status: { notIn: ["canceled", "completed"] }
        }
      });

      if (existing) return res.status(409).json({ error: "Time slot occupied" });

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          patientId: req.user.id,
          doctorId,
          date: appointmentDate,
          status: "pending",
          notes
        },
        include: { doctor: true, patient: true }
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ error: "Booking failed" });
    }
  }
);

// Get Patient Appointments (Enhanced)
app.get("/api/patient/appointments", authenticateToken, checkRole(['PATIENT']), async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            available: true
          }
        }
      },
      orderBy: [
        { date: 'desc' }
      ]
    });

    // Fallback for deleted doctors
    const safeAppointments = appointments.map(appt => ({
      ...appt,
      doctor: appt.doctor || {
        id: "",
        name: "Unknown Doctor",
        email: "",
        available: false
      },
      date: appt.date.toISOString() // Ensure ISO string format
    }));

    res.json(safeAppointments);
  } catch (error) {
    next(new AppError("Failed to fetch appointments", 500));
  }
});

// Get Doctor Appointments (Enhanced)
app.get("/api/doctor/appointments", authenticateToken, checkRole(['DOCTOR']), async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { date: 'asc' }
      ]
    });

    // Fallback for deleted patients
    const safeAppointments = appointments.map(appt => ({
      ...appt,
      patient: appt.patient || {
        id: "",
        name: "Unknown Patient",
        email: ""
      },
      date: appt.date.toISOString() // Ensure ISO string format
    }));

    res.json(safeAppointments);
  } catch (error) {
    next(new AppError("Failed to fetch appointments", 500));
  }
});

// Update Appointment Status (Enhanced)
app.put(
  "/api/appointments/:id/status",
  authenticateToken,
  [
    body("status").isIn(["confirmed", "canceled", "completed", "pending"])
      .withMessage("Invalid status value")
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true } },
          patient: { select: { id: true } }
        }
      });

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Authorization check
      const canUpdate = req.user.role === "ADMIN" ||
                       req.user.id === appointment.doctor.id ||
                       req.user.id === appointment.patient.id;

      if (!canUpdate) {
        return res.status(403).json({ error: "Unauthorized to update this appointment" });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          doctor: { select: { name: true } },
          patient: { select: { name: true } }
        }
      });

      res.json({
        message: "Appointment status updated",
        appointment: updatedAppointment
      });
    } catch (error) {
      next(new AppError("Failed to update status", 500));
    }
  }
);

// Admin User Management
app.post('/api/admin/users',
  authenticateToken,
  checkRole(['ADMIN']),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/),
    body('role').isIn(['PATIENT', 'DOCTOR', 'ADMIN']),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
    body('nationalId').notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, role, gender, nationalId } = req.body;

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return res.status(400).json({ error: "Email already exists" });

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          gender,
          nationalId,
          available: role === 'DOCTOR'
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });

      res.status(201).json(user);
    } catch (error) {
      next(new AppError("Failed to create user", 500));
    }
  }
);

app.put('/api/admin/users/:id/role',
  authenticateToken,
  checkRole(['ADMIN']),
  [
    body('role').isIn(['PATIENT', 'DOCTOR', 'ADMIN'])
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: req.body.role, available: req.body.role === 'DOCTOR' },
        select: { id: true, role: true }
      });
      res.json(user);
    } catch (error) {
      next(new AppError("Failed to update role", 500));
    }
  }
);

app.delete('/api/admin/users/:id',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      await prisma.appointment.deleteMany({
        where: {
          OR: [
            { patientId: req.params.id },
            { doctorId: req.params.id }
          ]
        }
      });

      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ message: "User and associated appointments deleted successfully" });
    } catch (error) {
      next(new AppError("Failed to delete user", 500));
    }
  }
);

// Get all users (paginated)
app.get('/api/admin/users',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const users = await prisma.user.findMany({
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          gender: true,
          nationalId: true,
          available: true,
          createdAt: true
        }
      });
      const total = await prisma.user.count();
      res.json({ data: users, total, page: parseInt(page), pageSize: parseInt(limit) });
    } catch (error) {
      next(new AppError("Failed to fetch users", 500));
    }
  }
);

// Get all appointments
app.get('/api/admin/appointments',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Add type-safe date conversion and fallbacks
      const safeAppointments = appointments.map(appt => ({
        ...appt,
        date: appt.date.toISOString(),
        createdAt: appt.createdAt.toISOString(),
        updatedAt: appt.updatedAt.toISOString(),
        patient: appt.patient || {
          id: appt.patientId || "deleted-user",
          name: "Unknown Patient",
          email: null
        },
        doctor: appt.doctor || {
          id: appt.doctorId || "deleted-user",
          name: "Unknown Doctor",
          email: null
        }
      }));

      res.json(safeAppointments);
    } catch (error) {
      next(new AppError("Failed to fetch appointments", 500));
    }
  }
);

// Updated Stats Endpoint
app.get('/api/admin/stats',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      if (!statsCache) throw new Error("Cache system not initialized");

      const cachedStats = statsCache.get("stats");
      if (cachedStats) return res.json(cachedStats);

      const [totalUsers, activeDoctors, totalAppointments, pendingAppointments] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "DOCTOR", available: true } }),
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: "pending" } })
      ]);

      const userGrowth = await prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          COUNT(*)::INTEGER as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
      `;

      const appointmentTrends = await prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          COUNT(*)::INTEGER as count
        FROM appointments
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
      `;

      const stats = {
        totalUsers: Number(totalUsers),
        activeDoctors: Number(activeDoctors),
        totalAppointments: Number(totalAppointments),
        pendingAppointments: Number(pendingAppointments),
        userGrowth: userGrowth.map(ug => ({
          date: ug.date,
          count: Number(ug.count)
        })),
        appointmentTrends: appointmentTrends.map(at => ({
          date: at.date,
          count: Number(at.count)
        }))
      };

      statsCache.set("stats", stats);
      res.json(stats);
    } catch (error) {
      console.error('Stats endpoint error:', error);
      next(new AppError("Failed to fetch stats", 500));
    }
  }
);

// Export Endpoints
app.get('/api/admin/export/users',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
      res.json(users);
    } catch (error) {
      next(new AppError("Failed to export users", 500));
    }
  }
);

app.get('/api/admin/export/appointments',
  authenticateToken,
  checkRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } }
        }
      });

      const safeAppointments = appointments.map(appt => ({
        id: appt.id,
        date: appt.date.toISOString(),
        status: appt.status,
        patientName: appt.patient?.name || "Unknown",
        doctorName: appt.doctor?.name || "Unknown",
        createdAt: appt.createdAt.toISOString()
      }));

      res.json(safeAppointments);
    } catch (error) {
      next(new AppError("Failed to export appointments", 500));
    }
  }
);

// Doctor Assignment Endpoint
app.put('/api/appointments/:id/assign',
  authenticateToken,
  checkRole(['ADMIN']),
  [
    body('doctorId').isString().notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const appointment = await prisma.appointment.update({
        where: { id: req.params.id },
        data: { doctorId: req.body.doctorId },
        include: {
          doctor: { select: { name: true } },
          patient: { select: { name: true } }
        }
      });
      res.json(appointment);
    } catch (error) {
      next(new AppError("Failed to assign doctor", 500));
    }
  }
);

// Notification Endpoints
app.get('/api/notifications', authenticateToken, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    next(new AppError("Failed to fetch notifications", 500));
  }
});

app.post('/api/notifications/mark-read', authenticateToken, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    next(new AppError("Failed to update notifications", 500));
  }
});

// Enhanced Reminder System
const sendAppointmentReminders = async () => {
  const now = new Date();
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: now,
        lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      },
      status: 'confirmed',
      reminderSent: false,
      OR: [
        { patient: { email: { not: null } } },
        { doctor: { email: { not: null } } }
      ]
    },
    include: {
      patient: true,
      doctor: true
    }
  });

  for (const appointment of upcomingAppointments) {
    // Create in-app notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.patientId,
          title: 'Upcoming Appointment',
          message: `Your appointment with Dr. ${appointment.doctor.name} is scheduled for ${formatDate(appointment.date)}`,
          type: 'appointment',
          relatedId: appointment.id
        },
        {
          userId: appointment.doctorId,
          title: 'Upcoming Consultation',
          message: `You have an appointment with ${appointment.patient.name} at ${formatDate(appointment.date)}`,
          type: 'appointment',
          relatedId: appointment.id
        }
      ]
    });

    // Email notifications (pseudo-code)
    if (process.env.NODE_ENV === 'production') {
      await sendEmailNotification(appointment);
    }

    // Mark as reminded
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSent: true }
    });
  }
};

// Update your existing cron job
cron.schedule('0 * * * *', sendAppointmentReminders); // Every hour

// Centralized Error Handling
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack
    })
  });
});

// Integrate PeerJS server
const peerServer = ExpressPeerServer(app, {
  debug: true,
  path: '/peerjs'
});

app.use('/peerjs', peerServer);

// Generate Room Tokens
app.post('/api/generate-room-token', authenticateToken, async (req, res) => {
  const { appointmentId } = req.body;
  const { id: userId, role } = req.user;

  // Verify appointment belongs to this user
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, doctor: true }
  });

  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  // Check authorization
  const isAuthorized = (
    role === 'ADMIN' ||
    userId === appointment.patientId ||
    userId === appointment.doctorId
  );

  if (!isAuthorized) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Generate token with 1 hour expiration
  const roomToken = jwt.sign({
    roomId: `consultation-${appointmentId}`,
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 3600
  }, process.env.JWT_SECRET);

  res.json({ roomToken });
});

// Server-Side Verification Endpoint (Critical Security Fix)
app.post('/api/verify-room-token', authenticateToken, async (req, res) => {
  const { roomToken } = req.body; // Changed from 'token' to 'roomToken'

  if (!roomToken) {
    return res.status(400).json({
      valid: false,
      error: "Token is required"
    });
  }

  try {
    const decoded = jwt.verify(roomToken, process.env.JWT_SECRET);

    const isValid = (
      decoded.exp > Date.now() / 1000 &&
      decoded.roomId?.startsWith('consultation-') &&
      (decoded.userId === req.user.id || req.user.role === 'ADMIN') // Additional security check
    );

    return res.json({
      valid: isValid,
      roomId: decoded.roomId,
      userId: decoded.userId,
      role: decoded.role
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      valid: false,
      error: "Invalid or expired token"
    });
  }
});

// Add Socket.io signaling server
const httpServer = http.createServer(app); // Use http.createServer here
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('signal', ({ roomId, signal }) => {
    socket.to(roomId).emit('signal', signal);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});