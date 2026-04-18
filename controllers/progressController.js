const mongoose = require("mongoose");
const Company = require("../models/Company");
const Question = require("../models/Question");
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");

function startOfDayUtc(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function diffDaysUtc(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDayUtc(to).getTime() - startOfDayUtc(from).getTime()) / msPerDay);
}

async function updateStreak(userId, now = new Date()) {
  const user = await User.findById(userId).select("streak");
  if (!user) return;

  const currentStreak = user.streak?.current || 0;
  const lastSolvedDate = user.streak?.lastSolvedDate || null;

  if (!lastSolvedDate) {
    user.streak = { current: 1, lastSolvedDate: now };
    await user.save();
    return;
  }

  const dayGap = diffDaysUtc(lastSolvedDate, now);
  if (dayGap === 0) {
    return;
  }

  if (dayGap === 1) {
    user.streak = { current: currentStreak + 1, lastSolvedDate: now };
    await user.save();
    return;
  }

  user.streak = { current: 1, lastSolvedDate: now };
  await user.save();
}

async function getByCompany(req, res) {
  try {
    const company = decodeURIComponent(req.params.company || "").trim();
    if (!company) return res.status(400).json({ message: "Company is required." });
    const userId = req.user.userId;

    const rows = await UserProgress.find({ userId, company }).select("questionId").lean();
    const solvedQuestionIds = rows.map((r) => String(r.questionId));
    res.json({ company, solvedQuestionIds });
  } catch {
    res.status(500).json({ message: "Failed to load progress." });
  }
}

async function toggle(req, res) {
  try {
    const { company, questionId } = req.body || {};
    if (!company || !questionId) {
      return res.status(400).json({ message: "company and questionId are required." });
    }
    const userId = req.user.userId;
    const q = await Question.findById(questionId).lean();
    if (!q || q.company !== String(company).trim()) {
      return res.status(400).json({ message: "Invalid question for this company." });
    }

    const existing = await UserProgress.findOne({
      userId,
      questionId: new mongoose.Types.ObjectId(String(questionId)),
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ solved: false, questionId: String(questionId) });
    }

    await UserProgress.create({
      userId,
      company: String(company).trim(),
      questionId,
      solved: true,
    });

    await updateStreak(userId);

    res.json({ solved: true, questionId: String(questionId) });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Progress already exists." });
    }
    res.status(500).json({ message: "Failed to update progress." });
  }
}

async function summary(req, res) {
  try {
    const userId = req.user.userId;
    const [totalCompanies, totalQuestions, solvedCount, user] = await Promise.all([
      Company.countDocuments(),
      Question.countDocuments(),
      UserProgress.countDocuments({ userId }),
      User.findById(userId).select("streak.current").lean(),
    ]);
    const overallPct = totalQuestions
      ? Math.round((solvedCount / totalQuestions) * 100)
      : 0;
    res.json({
      totalCompanies,
      totalQuestions,
      solvedCount,
      overallPct,
      streak: user?.streak?.current || 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to load summary." });
  }
}

async function getDashboardData(userId) {
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  const [companies, questionTotals, solvedTotals, totalQuestions, solvedCount, user] =
    await Promise.all([
      Company.find({}).sort({ name: 1 }).select("_id name").lean(),
      Question.aggregate([
        { $group: { _id: "$company", total: { $sum: 1 } } },
      ]),
      UserProgress.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: "$company", solved: { $sum: 1 } } },
      ]),
      Question.countDocuments(),
      UserProgress.countDocuments({ userId }),
      User.findById(userId).select("streak.current").lean(),
    ]);

  const totalsByCompany = new Map(
    questionTotals.map((row) => [String(row._id), Number(row.total || 0)])
  );
  const solvedByCompany = new Map(
    solvedTotals.map((row) => [String(row._id), Number(row.solved || 0)])
  );

  const overviewCompanies = companies.map((company) => {
    const name = String(company.name);
    const total = totalsByCompany.get(name) || 0;
    const solved = solvedByCompany.get(name) || 0;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { name, solved, total, pct };
  });

  const overallPct = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

  return {
    summary: {
      totalCompanies: companies.length,
      totalQuestions,
      solvedCount,
      overallPct,
      streak: user?.streak?.current || 0,
    },
    companies: companies.map((company) => ({
      _id: String(company._id),
      name: String(company.name),
    })),
    overview: {
      companies: overviewCompanies,
    },
  };
}

async function overview(req, res) {
  try {
    const userId = req.user.userId;
    const data = await getDashboardData(userId);
    res.json(data.overview);
  } catch {
    res.status(500).json({ message: "Failed to load overview." });
  }
}

async function dashboard(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const userId = req.user.userId;
    const data = await getDashboardData(userId);

    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    res.set("Server-Timing", `dashboard;dur=${elapsedMs.toFixed(1)}`);

    res.json({
      ...data,
      meta: {
        responseTimeMs: Math.round(elapsedMs),
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to load dashboard." });
  }
}

module.exports = { getByCompany, toggle, summary, overview, dashboard };
