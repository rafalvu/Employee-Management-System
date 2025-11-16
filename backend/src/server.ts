import "dotenv/config";
import express from "express";
import { hashPassword, comparePassword } from "./auth/password.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./db/prisma.js";
import { verifyToken, generateToken } from "./auth/jwt.js";
import { authenticate } from "./auth/middleware.js";
import { authorize } from "./auth/authorize.js";
import cors from "cors";

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Registration endpoint
app.post("/api/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: "Registration successful",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Updated Login endpoint - check against database
app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Employee API Server - Rafał Walczewski's FullStack Project",
  });
});

// Protected routes && get all employees
app.get("/api/employees", authenticate, async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany();
  res.json(employees);
});

// Get employee by ID
app.get(
  "/api/employees/:id",
  authenticate,
  async (req: Request, res: Response) => {
    if (!req.params.id) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const employeeId = parseInt(req.params.id!, 10);

    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Create new employee
app.post(
  "/api/employees",
  authenticate,
  async (req: Request, res: Response) => {
    // Validate input
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({ error: "Name and email required" });
    }
    if (!req.body.email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const employee = await prisma.employee.create({
      data: req.body,
    });
    res.json(employee);
  }
);

//Update employee
app.put(
  "/api/employees/:id",
  authenticate,
  async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id as string, 10);

    // Validate input
    if (req.body.email && !req.body.email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    try {
      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: req.body,
      });
      res.json(updatedEmployee);
    } catch (error) {
      res.status(404).json({ error: "Employee not found" });
    }
  }
);

// Delete employee - only admins can delete
app.delete(
  "/api/employees/:id",
  authenticate,
  authorize(["admin"]), // Only admins can delete
  async (req: Request, res: Response) => {
    const employeeId = parseInt(req.params.id as string, 10);

    try {
      await prisma.employee.delete({
        where: { id: employeeId },
      });
      res.json({ message: "Employee deleted" });
    } catch (error) {
      res.status(404).json({ error: "Employee not found" });
    }
  }
);

// Delete user - only admins can delete users
app.delete(
  "/api/users/:id",
  authenticate,
  authorize(["admin"]),
  async (req: Request, res: Response) => {
    if (!req.params.id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userId = parseInt(req.params.id!, 10);

    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(404).json({ error: "User not found" });
    }
  }
);

//Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
