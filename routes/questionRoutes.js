const express = require("express");
const {
  getQuestionsByCompany,
  getQuestionsBySubject,
  createQuestion,
  deleteQuestion,
} = require("../controllers/questionController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/questions", authMiddleware, getQuestionsBySubject);
router.get("/questions/subject/:subject", authMiddleware, getQuestionsBySubject);
router.get("/questions/:company", getQuestionsByCompany);
router.post("/questions", authMiddleware, adminOnly, createQuestion);
router.delete("/questions/:id", authMiddleware, adminOnly, deleteQuestion);

module.exports = router;

