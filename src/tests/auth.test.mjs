import assert from "node:assert/strict";
import * as TokenService from "../services/token.service.js";
import { validateEmail, validatePassword } from "../utils/validator.js";

const mockPayload = { id: 1, email: "test@vialifecoach-academy.com" };

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`[PASS] Authentication - ${name}`);
  } catch (error) {
    console.error(`[FAIL] Authentication - ${name}`);
    throw error;
  }
}

export default async function runAuthTests() {
  console.log("Running Authentication Tests");

  await runCase("TokenService#generateToken returns a JWT string", () => {
    const token = TokenService.generateToken(mockPayload);
    assert.equal(typeof token, "string");
    assert.equal(token.split(".").length, 3);
  });

  await runCase("TokenService#verifyToken accepts valid token", () => {
    const token = TokenService.generateToken(mockPayload);
    const decoded = TokenService.verifyToken(token);
    assert.equal(decoded.id, mockPayload.id);
    assert.equal(decoded.email, mockPayload.email);
  });

  await runCase("TokenService#verifyToken rejects invalid token", () => {
    assert.throws(() => TokenService.verifyToken("invalid.token.here"));
  });

  await runCase("TokenService#generateRefreshToken returns a JWT", () => {
    const refreshToken = TokenService.generateRefreshToken(mockPayload);
    assert.equal(typeof refreshToken, "string");
    assert.equal(refreshToken.split(".").length, 3);
  });

  await runCase("TokenService#extractTokenFromHeader extracts bearer token", () => {
    const authHeader = "Bearer abc123.def456.ghi789";
    const token = TokenService.extractTokenFromHeader(authHeader);
    assert.equal(token, "abc123.def456.ghi789");
  });

  await runCase("TokenService#extractTokenFromHeader handles invalid header", () => {
    assert.equal(TokenService.extractTokenFromHeader("Invalid header"), null);
    assert.equal(TokenService.extractTokenFromHeader(null), null);
  });

  await runCase("validateEmail accepts valid emails", () => {
    assert.equal(validateEmail("test@vialifecoach-academy.com"), true);
    assert.equal(validateEmail("user.name+tag@example.co.uk"), true);
  });

  await runCase("validateEmail rejects invalid emails", () => {
    assert.equal(validateEmail("invalid-email"), false);
    assert.equal(validateEmail("test@"), false);
    assert.equal(validateEmail("@example.com"), false);
  });

  await runCase("validatePassword accepts strong passwords", () => {
    assert.equal(validatePassword("StrongPass123"), true);
    assert.equal(validatePassword("Another!Pass9"), true);
  });

  await runCase("validatePassword rejects weak passwords", () => {
    assert.equal(validatePassword("weak"), false);
    assert.equal(validatePassword("12345678"), false);
    assert.equal(validatePassword("password"), false);
    assert.equal(validatePassword("PASSWORD"), false);
  });
}

if (process.argv[1].endsWith("auth.test.js")) {
  runAuthTests().catch((err) => {
    console.error("Authentication tests failed", err);
    process.exit(1);
  });
}
