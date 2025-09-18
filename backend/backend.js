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

// Initialize DB
let db;
initDB()
  .then((database) => {
    db = database;
    console.log("✅ Database initialized");
  })
  .catch((err) => {
    console.error("DB init error:", err);
  });

// Root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "FETSCR backend is running" });
});

// ----------------- User Signup -----------------
app.post("/signup", async (req, res) => {
  try {
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
      return res
        .status(400)
        .json({ success: false, error: "Email already registered" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- User Login -----------------
app.post("/login", async (req, res) => {
  try {
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
    plan.queries_remaining = Math.max(
      0,
      plan.allowed_queries - plan.queries_used
    );

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
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user)
      return res
        .status(400)
        .json({ success: false, error: "No user found with that email" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user.id,
    ]);

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

// ----------------- Set Plan -----------------
app.post("/setPlan", authenticate, async (req, res) => {
  try {
    const { plan, queries, results, resultsPerQuery } = req.body;

    const userRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!userRow)
      return res.status(404).json({ success: false, error: "User not found" });

    let plan_type = "free";
    let allowed_queries = 2;
    let results_per_query = 5;
    let priceUSD = 0;

    switch(plan) {
      case "free":
        break;
      case "sub1":
        plan_type="sub1"; allowed_queries=30; results_per_query=20; priceUSD=21.18; break;
      case "sub2":
        plan_type="sub2"; allowed_queries=30; results_per_query=50; priceUSD=52.94; break;
      case "sub3":
        plan_type="sub3"; allowed_queries=30; results_per_query=25; priceUSD=26.47; break;
      case "sub4":
        plan_type="sub4"; allowed_queries=20; results_per_query=50; priceUSD=35.29; break;
      case "enterprise":
        const q = Number(queries) || 1;
        const r = Number(results ?? resultsPerQuery) || 5;
        allowed_queries = Math.max(1, Math.min(10000, q));
        results_per_query = Math.max(1, Math.min(100, r));
        plan_type = "enterprise";
        priceUSD = Number(((allowed_queries * results_per_query) * 0.04).toFixed(2));
        break;
      default:
        return res.status(400).json({ success: false, error: "Unknown plan" });
    }

    await db.run(
      "UPDATE users SET plan_type = ?, allowed_queries = ?, results_per_query = ?, queries_used = 0 WHERE id = ?",
      [plan_type, allowed_queries, results_per_query, req.user.id]
    );

    res.json({
      success: true,
      plan: plan_type,
      allowed_queries,
      results_per_query,
      priceUSD,
      message: "Plan updated successfully",
    });
  } catch (err) {
    console.error("setPlan error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
});

// ----------------- Get Plan -----------------
app.get("/getPlan", authenticate, async (req, res) => {
  try {
    const userRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!userRow) return res.status(404).json({ success: false, error: "User not found" });

    const plan = {
      plan_type: userRow.plan_type || "free",
      allowed_queries: userRow.allowed_queries ?? 2,
      results_per_query: userRow.results_per_query ?? 5,
      queries_used: userRow.queries_used ?? 0,
    };
    plan.queries_remaining = Math.max(
      0,
      plan.allowed_queries - plan.queries_used
    );

    res.json({ success: true, plan });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Optimized Scrape -----------------
async function scrapeGoogle(query, numResults = 5) {
  const items = [];
  let startIndex = 1;

  while(items.length < numResults && startIndex <= 100) {
    const remaining = numResults - items.length;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${startIndex}&num=${Math.min(10, remaining)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google API error ${res.status}`);
    const data = await res.json();
    if (!data.items || !data.items.length) break;

    items.push(...data.items.map((item) => ({
      name: (item.title || "").split(" - ")[0] || null,
      title: (item.title || "").split(" - ").slice(1).join(" - ") || null,
      link: item.link || null,
      snippet: item.snippet || null,
      image: item.pagemap?.cse_thumbnail?.[0]?.src || null,
    })));

    if (!data.queries?.nextPage?.[0]) break;
    startIndex = data.queries.nextPage[0].startIndex;
  }

  return items.slice(0, numResults);
}

app.post("/scrape", authenticate, async (req, res) => {
  try {
    const { query, pages = 1 } = req.body;
    if (!query || !query.trim())
      return res.status(400).json({ success: false, error: "Missing query" });

    const userRow = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!userRow) return res.status(404).json({ success: false, error: "User not found" });

    if (userRow.queries_used >= userRow.allowed_queries) {
      return res.status(403).json({
        success: false,
        error: "Query limit reached for this plan. Please upgrade your plan.",
      });
    }

    const totalResults = userRow.results_per_query ?? 5;
    const results = await scrapeGoogle(query, totalResults);

    await db.run(
      "INSERT INTO scraped_queries (user_id, query, result_count) VALUES (?, ?, ?)",
      [req.user.id, query, results.length]
    );

    await db.run("UPDATE users SET queries_used = queries_used + 1 WHERE id = ?", [req.user.id]);

    const updatedUser = await db.get(
      "SELECT queries_used, allowed_queries, results_per_query FROM users WHERE id = ?",
      [req.user.id]
    );
    const queries_remaining = Math.max(
      0,
      (updatedUser.allowed_queries ?? 2) - (updatedUser.queries_used ?? 0)
    );

    res.json({
      success: true,
      count: results.length,
      results,
      queries_used: updatedUser.queries_used,
      queries_remaining,
      results_per_query: updatedUser.results_per_query,
    });
  } catch (err) {
    console.error("scrape error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Get user's scraped history -----------------
app.get("/my-scrapes", authenticate, async (req, res) => {
  try {
    const history = await db.all(
      "SELECT * FROM scraped_queries WHERE user_id = ? ORDER BY timestamp DESC",
      [req.user.id]
    );
    res.json({ success: true, history });
  } catch (err) {
    console.error("my-scrapes error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
