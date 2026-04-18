const Company = require("../models/Company");

async function getCompanies(req, res) {
  try {
    const companies = await Company.find({}).sort({ name: 1 }).lean();
    res.json({ companies });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch companies." });
  }
}

async function createCompany(req, res) {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required." });
    }

    const company = await Company.create({ name: String(name).trim() });
    res.status(201).json({ company });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Company already exists." });
    }
    res.status(500).json({ message: "Failed to create company." });
  }
}

async function deleteCompany(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ message: "Company id is required." });
    }

    const deleted = await Company.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Company not found." });
    }

    res.json({ message: "Company deleted.", company: deleted });
  } catch {
    res.status(500).json({ message: "Failed to delete company." });
  }
}

module.exports = { getCompanies, createCompany, deleteCompany };

