const jwt = require("jsonwebtoken");
const { getEnv } = require("../config/env");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  try {
    const payload = jwt.verify(token, getEnv().JWT_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || "user",
    };
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] req.user", req.user);
    }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminOnly,
  authRequired: authMiddleware,
};
