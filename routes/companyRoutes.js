const express = require("express");
const {
	getCompanies,
	createCompany,
	deleteCompany,
} = require("../controllers/companyController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/companies", getCompanies);
router.post("/companies", authMiddleware, adminOnly, createCompany);
router.delete("/companies/:id", authMiddleware, adminOnly, deleteCompany);

module.exports = router;

