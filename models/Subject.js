const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    shortTitle: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    icon: { type: String, default: "network", trim: true },
    topics: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
