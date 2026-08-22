import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { db } from "../lib/db.js";
import { ROLES } from "../lib/constants.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function initialsOf(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// HelpDesk Lite's current frontend is a single shared staff workspace —
// everyone who signs up manages every ticket (no separate Employee-only
// portal in the UI yet). So public registration here defaults to
// "Support Agent" (full ticket access), matching today's actual behavior.
// If you later split the UI into an Employee-submits-only portal, change
// this default back to "Employee" and use /provision for staff accounts.
authRouter.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: "Support Agent",
    initials: initialsOf(name),
  };

  db.prepare(
    "INSERT INTO users (id, name, email, passwordHash, role, initials) VALUES (@id, @name, @email, @passwordHash, @role, @initials)"
  ).run(user);

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name, email: user.email, role: user.role, initials: user.initials } });
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials } });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Internal-only: provisioning Support Agent / Manager accounts.
// Protected by a separate provisioning key, never exposed to the public UI —
// mirrors the "no public role selector" rule from the reference project.
authRouter.post("/provision", (req, res) => {
  const provisioningKey = req.headers["x-provisioning-key"];
  if (!provisioningKey || provisioningKey !== process.env.PROVISIONING_KEY) {
    return res.status(403).json({ error: "Invalid provisioning key" });
  }

  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !ROLES.includes(role)) {
    return res.status(400).json({ error: `name, email, password and a valid role (${ROLES.join(", ")}) are required` });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    initials: initialsOf(name),
  };

  db.prepare(
    "INSERT INTO users (id, name, email, passwordHash, role, initials) VALUES (@id, @name, @email, @passwordHash, @role, @initials)"
  ).run(user);

  res.status(201).json({ user: { id: user.id, name, email: user.email, role: user.role, initials: user.initials } });
});
