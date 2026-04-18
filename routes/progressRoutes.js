const express = require("express");
const {
  getByCompany,
  toggle,
  summary,
  overview,
  dashboard,
} = require("../controllers/progressController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/progress/summary", authRequired, summary);
router.get("/progress/overview", authRequired, overview);
router.get("/dashboard", authRequired, dashboard);
router.get("/progress/:company", authRequired, getByCompany);
router.post("/progress/toggle", authRequired, toggle);

module.exports = router;
