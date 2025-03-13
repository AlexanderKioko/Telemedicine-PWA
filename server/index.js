const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config(); // Load environment variables

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // Allow JSON requests

// Default Route to Check if Backend is Running
app.get("/", (req, res) => {
  res.send("API is running...");
});

// User Registration API
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    // Hash password and store user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    res.json({ message: "User registered successfully!", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// User Login API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, name: user.name, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware: Verify JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = decoded; // Attach decoded user info to the request
    next();
  });
};

// Protected Route Example
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

// Book an Appointment (Patient)
app.post("/api/appointments", authenticateToken, async (req, res) => {
  const { patientId, doctorId } = req.body;

  if (req.user.role !== "PATIENT") {
    return res.status(403).json({ error: "Only patients can book appointments" });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: { patientId, doctorId, status: "pending" },
    });

    res.json({ message: "Appointment booked successfully!", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// Get All Appointments (Doctor/Admin)
app.get("/api/appointments", authenticateToken, async (req, res) => {
  if (req.user.role !== "DOCTOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only doctors and admins can view appointments" });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      include: { patient: true, doctor: true },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Update Appointment Status (Doctor/Admin)
app.put("/api/appointments/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "confirmed" | "completed" | "canceled"

  if (req.user.role !== "DOCTOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only doctors and admins can update appointments" });
  }

  try {
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.json({ message: "Appointment updated successfully!", updatedAppointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));