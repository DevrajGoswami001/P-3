const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authMiddleware, me);

module.exports = router;
