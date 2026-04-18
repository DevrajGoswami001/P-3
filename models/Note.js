const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
