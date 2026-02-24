import '../config/env.js';
import jwt from "jsonwebtoken";

export function generateAccessToken(user) {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_TIME || "1d";
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined in environment");
  return jwt.sign(user, secret, { expiresIn });
}
