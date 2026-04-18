const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getEnv } = require("../config/env");

function signToken(user) {
  return jwt.sign(
    { userId: String(user._id), email: user.email, role: user.role || "user" },
    getEnv().JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      name: name ? String(name).trim() : "",
      role: "user",
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("[auth.register]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("[auth.login]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.userId).select("email name role").lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("[auth.me]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { register, login, me };
