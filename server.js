require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const { validateEnv, getEnv, isDevelopment } = require("./config/env");
const { connectDB } = require("./config/db");
const { seedIfNeeded, seedAdminUser, seedDefaultSubjects } = require("./data/seed");
const companyRoutes = require("./routes/companyRoutes");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/authRoutes");
const progressRoutes = require("./routes/progressRoutes");
const noteRoutes = require("./routes/noteRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();
let env;

try {
  env = validateEnv();
  if (isDevelopment()) {
    console.log("JWT loaded successfully");
  }
} catch (error) {
  console.error(`[env] ${error.message}`);
  process.exit(1);
}

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : "*",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Required API shape
app.use("/", companyRoutes);
app.use("/", questionRoutes);
app.use("/", authRoutes);
app.use("/", progressRoutes);
app.use("/", noteRoutes);
app.use("/", subjectRoutes);

// Optional alias (handy for frontend env defaults)
app.use("/api", companyRoutes);
app.use("/api", questionRoutes);
app.use("/api", authRoutes);
app.use("/api", progressRoutes);
app.use("/api", noteRoutes);
app.use("/api", subjectRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

async function start() {
  getEnv();
  await connectDB();

  const seedResult = await seedIfNeeded();
  if (seedResult.seeded) {
    console.log(
      `Seeded: ${seedResult.companyCount} companies, ${seedResult.questionCount} questions`
    );
  }

  const adminSeed = await seedAdminUser();
  if (isDevelopment() && adminSeed.seeded) {
    console.log(`Admin user created: ${adminSeed.email}`);
  }

  const subjectSeed = await seedDefaultSubjects();
  if (isDevelopment() && subjectSeed.created > 0) {
    console.log(`Default subjects created: ${subjectSeed.created}`);
  }

  const port = env.PORT;
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

