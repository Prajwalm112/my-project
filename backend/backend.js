// backend.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initDB } from "./database.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" })); // restrict in production
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.CX;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Check environment variables
if (!GOOGLE_API_KEY || !CX) {
  console.error("❌ GOOGLE_API_KEY or CX is missing in .env");
  process.exit(1);
}

// ----------------- Database Init -----------------
let db;
(async () => {
  try {
    db = await initDB();
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DB init error:", err);
    process.exit(1); // stop server if DB fails
  }
})();

// Root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "FETSCR backend is running" });
});

// ----------------- User Signup -----------------
app.post("/signup", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, error: "DB not ready" });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO users (name, email, password, plan_type, allowed_queries, results_per_query, queries_used)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, "free", 2, 5, 0]
    );
    res.json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("signup error:", err);
    if (err.message && err.message.includes("UNIQUE")) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- User Login -----------------
app.post("/login", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, error: "DB not ready" });

    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user)
      return res.status(400).json({ success: false, error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ success: false, error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const plan = {
      plan_type: user.plan_type || "free",
      allowed_queries: user.allowed_queries ?? 2,
      results_per_query: user.results_per_query ?? 5,
      queries_used: user.queries_used ?? 0,
    };
    plan.queries_remaining = Math.max(0, plan.allowed_queries - plan.queries_used);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
      plan,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Reset Password -----------------
app.post("/reset-password", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ success: false, error: "DB not ready" });

    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user)
      return res.status(400).json({ success: false, error: "No user found with that email" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Middleware to check JWT -----------------
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

// (keep your setPlan, getPlan, scrape, my-scrapes as they are)

app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
