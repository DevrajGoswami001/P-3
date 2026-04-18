const mongoose = require("mongoose");

const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true, index: true },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    solved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1, company: 1 });

module.exports = mongoose.model("UserProgress", UserProgressSchema);
