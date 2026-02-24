import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("__dirname:", __dirname);
console.log("process.cwd():", process.cwd());

const candidates = [
  path.join(__dirname, ".env.development.local"),
  path.join(__dirname, ".env"),
  path.join(process.cwd(), ".env.development.local"),
  path.join(process.cwd(), ".env"),
];

for (const c of candidates) {
  const exists = fs.existsSync(c);
  console.log(`${exists ? "✓ FOUND" : "✗ NOT FOUND"}: ${c}`);
  if (exists) {
    const result = config({ path: c });
    console.log("  dotenv result:", result.error ? result.error.message : "OK");
    console.log("  ACCESS_TOKEN_SECRET defined:", !!process.env.ACCESS_TOKEN_SECRET);
    break;
  }
}
