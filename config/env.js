const path = require("path");
const dotenv = require("dotenv");

const ENV_FILE_PATH = path.resolve(__dirname, "../.env");

let envLoaded = false;
let validatedEnv = null;

function loadEnv() {
  if (envLoaded) return;
  if (process.env.MONGODB_URI || process.env.JWT_SECRET || process.env.PORT) {
    envLoaded = true;
    return;
  }
  dotenv.config({ path: ENV_FILE_PATH });
  envLoaded = true;
}

function asNonEmpty(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function validateEnv() {
  loadEnv();

  const requiredVars = ["MONGODB_URI", "JWT_SECRET", "PORT"];
  const missing = requiredVars.filter((name) => !asNonEmpty(process.env[name]));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in .env: ${missing.join(", ")}`
    );
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid PORT in .env. PORT must be a positive integer.");
  }

  validatedEnv = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: port,
    MONGODB_URI: asNonEmpty(process.env.MONGODB_URI),
    JWT_SECRET: asNonEmpty(process.env.JWT_SECRET),
    CORS_ORIGIN: asNonEmpty(process.env.CORS_ORIGIN),
    ADMIN_EMAIL: asNonEmpty(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: asNonEmpty(process.env.ADMIN_PASSWORD),
  };

  return validatedEnv;
}

function getEnv() {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

function isDevelopment() {
  return getEnv().NODE_ENV !== "production";
}

module.exports = {
  ENV_FILE_PATH,
  loadEnv,
  validateEnv,
  getEnv,
  isDevelopment,
};

module.exports.default = module.exports;
