const Note = require("../models/Note");
const Subject = require("../models/Subject");

async function getNotesBySubject(req, res) {
  try {
    const raw = typeof req.params.subject === "string" ? req.params.subject.trim() : "";
    const subject = raw.toUpperCase();

    if (!subject) {
      return res.status(400).json({ message: "subject is required." });
    }

    const subjectDoc = await Subject.findOne({
      key: { $regex: `^${subject}$`, $options: "i" },
    })
      .select("_id key")
      .lean();
    if (!subjectDoc) {
      return res.status(400).json({ message: "Invalid subject." });
    }

    const notes = await Note.find({
      subject: { $regex: `^${subject}$`, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (process.env.NODE_ENV !== "production") {
      console.log("[notes.list] subject", subject);
      console.log("[notes.list] count", notes.length);
    }

    return res.json({ subject, notes });
  } catch (error) {
    console.error("[notes.list]", error);
    return res.status(500).json({ message: "Failed to fetch notes." });
  }
}

async function createNote(req, res) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[notes.create] req.user", req.user);
      console.log("[notes.create] req.body", req.body);
    }

    const body = req.body || {};
    const subject = typeof body.subject === "string" ? body.subject.trim().toUpperCase() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!subject || !title || !content) {
      return res.status(400).json({ message: "subject, title, and content are required." });
    }

    const subjectDoc = await Subject.findOne({
      key: { $regex: `^${subject}$`, $options: "i" },
    })
      .select("_id key")
      .lean();
    if (!subjectDoc) {
      return res.status(400).json({ message: "Invalid subject." });
    }

    const note = await Note.create({
      subject,
      title,
      content,
    });

    res.status(201).json({
      message: "Note created successfully.",
      note,
    });
  } catch (error) {
    console.error("[notes.create]", error);
    res.status(500).json({ message: "Failed to create note." });
  }
}

async function deleteNote(req, res) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!id) {
      return res.status(400).json({ message: "note id is required." });
    }

    const deleted = await Note.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Note not found." });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[notes.delete] req.user", req.user);
      console.log("[notes.delete] deletedId", id);
    }

    return res.json({ message: "Note deleted successfully.", note: deleted });
  } catch (error) {
    console.error("[notes.delete]", error);
    return res.status(500).json({ message: "Failed to delete note." });
  }
}

module.exports = { createNote, getNotesBySubject, deleteNote };
