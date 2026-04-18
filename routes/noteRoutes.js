const express = require("express");
const { createNote, getNotesBySubject, deleteNote } = require("../controllers/noteController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/notes/:subject", authMiddleware, getNotesBySubject);
router.post("/notes", authMiddleware, adminOnly, createNote);
router.delete("/notes/:id", authMiddleware, adminOnly, deleteNote);

module.exports = router;
