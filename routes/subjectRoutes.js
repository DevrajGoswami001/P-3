const express = require("express");
const { getSubjects, createSubject } = require("../controllers/subjectController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/subjects", authMiddleware, getSubjects);
router.post("/subjects", authMiddleware, adminOnly, createSubject);

module.exports = router;
