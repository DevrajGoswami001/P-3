const mongoose = require("mongoose");
const Question = require("../models/Question");
const Subject = require("../models/Subject");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toUpperCase();
}

async function getQuestionsByCompany(req, res) {
  try {
    const company = normalizeText(decodeURIComponent(req.params.company || ""));
    if (!company) return res.status(400).json({ message: "Company is required." });

    const rawQuestions = await Question.find({
      company: { $regex: `^${escapeRegex(company)}$`, $options: "i" },
    })
      .sort({ createdAt: 1 })
      .lean();

    const seen = new Set();
    const questions = rawQuestions.filter((q) => {
      const key = `${normalizeKey(q.company)}::${normalizeKey(q.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[questions.fetch] company", company);
      console.log("[questions.fetch] rawCount", rawQuestions.length, "uniqueCount", questions.length);
      console.log(
        "[questions.fetch] titles",
        questions.map((q) => q.title)
      );
    }

    res.json({ company, questions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions." });
  }
}

async function getQuestionsBySubject(req, res) {
  try {
    const rawSubject =
      typeof req.query.subject === "string"
        ? req.query.subject
        : req.params.subject;
    const subject = normalizeText(decodeURIComponent(rawSubject || "")).toUpperCase();
    if (!subject) {
      return res.status(400).json({ message: "subject is required." });
    }

    console.log("QUERY FILTER:", { subject });

    const subjectDoc = await Subject.findOne({
      key: { $regex: `^${escapeRegex(subject)}$`, $options: "i" },
    })
      .select("_id key")
      .lean();
    if (!subjectDoc) {
      return res.status(400).json({ message: "Invalid subject." });
    }

    const rawQuestions = await Question.find({
      subject: { $regex: `^${escapeRegex(subject)}$`, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .lean();

    const seen = new Set();
    const questions = rawQuestions.filter((q) => {
      const key = `${normalizeKey(q.subject)}::${normalizeKey(q.company)}::${normalizeKey(q.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[questions.bySubject] subject", subject);
      console.log("[questions.bySubject] rawCount", rawQuestions.length, "uniqueCount", questions.length);
      console.log("[questions.bySubject] questions", questions.map((q) => q.title));
    }

    return res.json({ subject, questions });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch questions by subject." });
  }
}

async function createQuestion(req, res) {
  try {
    const { title, company, subject, difficulty, link } = req.body || {};
    if (!title || !company || !subject) {
      return res.status(400).json({ message: "title, company, and subject are required." });
    }

    console.log("REQ BODY:", req.body);

    const normalizedTitle = normalizeText(title);
    const normalizedCompany = normalizeText(company);
    const normalizedSubject = normalizeText(subject).toUpperCase();

    const subjectDoc = await Subject.findOne({
      key: { $regex: `^${escapeRegex(normalizedSubject)}$`, $options: "i" },
    })
      .select("_id key")
      .lean();
    if (!subjectDoc) {
      return res.status(400).json({ message: "Invalid subject." });
    }

    const existing = await Question.findOne({
      company: { $regex: `^${escapeRegex(normalizedCompany)}$`, $options: "i" },
      subject: { $regex: `^${escapeRegex(normalizedSubject)}$`, $options: "i" },
      title: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" },
    })
      .select("_id")
      .lean();

    if (existing) {
      return res.status(409).json({ message: "Question already exists for that company." });
    }

    const newQuestion = new Question({
      title: normalizedTitle,
      company: normalizedCompany,
      subject: normalizedSubject,
      difficulty: difficulty ? String(difficulty).trim() : undefined,
      link: link ? String(link).trim() : "",
    });

    const created = await newQuestion.save();

    console.log("Saved:", created);

    res.status(201).json({ question: created });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Question already exists for that company." });
    }
    res.status(500).json({ message: "Failed to create question." });
  }
}

async function deleteQuestion(req, res) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!id) {
      return res.status(400).json({ message: "question id is required." });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid question id." });
    }

    const deleted = await Question.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Question not found." });
    }

    console.log("Deleted:", deleted);

    return res.json({ message: "Question deleted successfully.", question: deleted });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete question." });
  }
}

module.exports = {
  getQuestionsByCompany,
  getQuestionsBySubject,
  createQuestion,
  deleteQuestion,
};

