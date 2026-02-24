import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve env file relative to the backend root (2 levels up from src/config/)
const backendRoot = path.resolve(__dirname, "../../");
const nodeEnv = process.env.NODE_ENV || "development";

// Try multiple locations in order of priority
const envCandidates = [
  path.join(backendRoot, `.env.${nodeEnv}.local`),
  path.join(backendRoot, `.env`),
  path.join(process.cwd(), `.env.${nodeEnv}.local`),
  path.join(process.cwd(), `.env`),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    config({ path: candidate });
    break;
  }
}

export const {
  PORT,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TIME,
  GMAIL_USER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_REDIRECT_URI
} = process.env;
