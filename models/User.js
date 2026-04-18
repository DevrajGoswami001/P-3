const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "", trim: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    streak: {
      current: { type: Number, default: 0 },
      lastSolvedDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
