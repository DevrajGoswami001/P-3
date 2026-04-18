const mongoose = require("mongoose");

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true, uppercase: true, index: true },
    difficulty: { type: String, enum: DIFFICULTIES, default: "Easy" },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

QuestionSchema.index({ company: 1, subject: 1 });
QuestionSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model("Question", QuestionSchema);

