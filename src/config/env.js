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

// Keep legacy and new Supabase env names in sync so either path works.
if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}

if (!process.env.SUPABASE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  process.env.SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
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
  GOOGLE_REDIRECT_URI,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USE_TLS,
  EMAIL_USE_SSL,
  EMAIL_HOST_USER,
  EMAIL_HOST_PASSWORD,
  DEFAULT_FROM_EMAIL,
  SERVER_EMAIL,
  EMAIL_FROM_SUPPORT,
  EMAIL_FROM_ACADEMY,
  EMAIL_FROM_INFO,
  EMAIL_FROM_PARTNERSHIP,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  FRONTEND_URL,
  GOOGLE_APPS_SCRIPT_URL,
  GOOGLE_APPS_SCRIPT_ADMIN_KEY
} = process.env;
