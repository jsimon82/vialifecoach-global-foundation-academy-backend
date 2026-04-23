import assert from "node:assert/strict";
import * as SupportController from "../controllers/support.controller.js";

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`[PASS] Support Controller - ${name}`);
  } catch (error) {
    console.error(`[FAIL] Support Controller - ${name}`);
    throw error;
  }
}

export default async function runSupportTests() {
  console.log("Running Support Controller Tests");

  await runCase("submitTicket returns 400 when payload invalid", async () => {
    const req = { body: { name: "", email: "not-an-email" } };
    const res = makeRes();
    await SupportController._submitTicket(req, res);
    assert.equal(res.statusCode, 400);
  });

  await runCase("submitBooking returns 400 when payload incomplete", async () => {
    const req = { body: { name: "Booking", email: "user@x.com" } };
    const res = makeRes();
    await SupportController._submitBooking(req, res);
    assert.equal(res.statusCode, 400);
  });
}

if (process.argv[1].endsWith("support.test.js")) {
  runSupportTests().catch((err) => {
    console.error("Support controller tests failed", err);
    process.exit(1);
  });
}
