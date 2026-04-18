const Subject = require("../models/Subject");

function slugify(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getSubjects(req, res) {
  try {
    const subjects = await Subject.find({}).sort({ title: 1 }).lean();
    return res.json({ subjects });
  } catch (error) {
    console.error("[subjects.list]", error);
    return res.status(500).json({ message: "Failed to fetch subjects." });
  }
}

async function createSubject(req, res) {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    const key = slugify(body.key || title);
    const shortTitle = String(body.shortTitle || title).trim();
    const description = String(body.description || "").trim();
    const icon = String(body.icon || "network").trim() || "network";
    const topics = Array.isArray(body.topics)
      ? body.topics.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!title) {
      return res.status(400).json({ message: "title is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "key is required." });
    }

    const existing = await Subject.findOne({
      key: { $regex: `^${key}$`, $options: "i" },
    })
      .select("_id")
      .lean();
    if (existing) {
      return res.status(409).json({ message: "Subject already exists." });
    }

    const subject = await Subject.create({
      key,
      title,
      shortTitle,
      description,
      icon,
      topics,
    });

    return res.status(201).json({ subject });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "Subject already exists." });
    }
    console.error("[subjects.create]", error);
    return res.status(500).json({ message: "Failed to create subject." });
  }
}

module.exports = { getSubjects, createSubject };
