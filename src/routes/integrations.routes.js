import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { createBookingZohoEvent } from "../controllers/zohoCalendar.controller.js";

const router = express.Router();

router.get("/integrations/zoho/auth-url", (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";
  const scope = process.env.ZOHO_CALENDAR_SCOPE || "ZohoCalendar.events.ALL";

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      message: "Zoho OAuth is not configured. Set ZOHO_CLIENT_ID and ZOHO_REDIRECT_URI."
    });
  }

  const params = new URLSearchParams({
    scope,
    client_id: clientId,
    response_type: "code",
    access_type: "offline",
    redirect_uri: redirectUri
  });

  return res.json({
    auth_url: `${accountsUrl}/oauth/v2/auth?${params.toString()}`
  });
});

router.get("/integrations/zoho/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ message: "Missing Zoho authorization code." });
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_REDIRECT_URI;
    const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        message: "Zoho OAuth is not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI."
      });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        message: "Failed to exchange Zoho code for tokens.",
        details: tokenData
      });
    }

    return res.json({
      message: "Zoho tokens received.",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      api_domain: tokenData.api_domain,
      expires_in: tokenData.expires_in
    });
  } catch (error) {
    return res.status(500).json({
      message: "Zoho callback failed.",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/integrations/zoho/calendar-events", authenticateToken, createBookingZohoEvent);

export default router;
