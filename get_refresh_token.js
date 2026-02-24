// Load environment variables from .env
import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import readline from "readline";

// Read credentials from .env
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

// Check if credentials exist
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing CLIENT_ID or CLIENT_SECRET in .env");
  process.exit(1);
}

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://mail.google.com/"];

// Generate the auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n👉 Open this URL in your browser to authorize:\n");
console.log(authUrl);
console.log("\nAfter logging in, paste the code here:\n");

// Setup readline for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Ask user for the code from Google
rl.question("Enter the code: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n✅ Refresh Token:\n");
    console.log(tokens.refresh_token);

    console.log(
      "\nCopy this token into your .env file as GOOGLE_REFRESH_TOKEN"
    );

    rl.close();
  } catch (err) {
    console.error("❌ Error getting refresh token:", err);
    rl.close();
  }
});
