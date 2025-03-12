const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json()); // Allow JSON requests

// Temporary user storage (Replace with database in production)
const users = [];

// Default Route to Check if Backend is Running
app.get("/", (req, res) => {
  res.send("API is running...");
});

// User Registration API
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  if (users.find((user) => user.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store user data
  const user = { id: users.length + 1, name, email, password: hashedPassword, role };
  users.push(user);

  res.json({ message: "User registered successfully!" });
});

// Updated User Login API (Includes `name` in JWT)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  // Check if user exists and password matches
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate JWT token including `id`, `name`, and `role`
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, name: user.name, role: user.role });
});

// Protected Route (Requires Valid JWT)
app.get("/api/protected", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract JWT token

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    res.json({ message: "Access granted", user: decoded });
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));