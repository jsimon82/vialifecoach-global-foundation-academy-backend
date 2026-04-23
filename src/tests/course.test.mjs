import assert from "node:assert/strict";
import { validateCourseData } from "../utils/validator.js";

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`[PASS] Course Validation - ${name}`);
  } catch (error) {
    console.error(`[FAIL] Course Validation - ${name}`);
    throw error;
  }
}

export default async function runCourseTests() {
  console.log("Running Course Validation Tests");

  await runCase("validateCourseData accepts valid course payload", () => {
    const result = validateCourseData({
      title: "Deep Focus Masterclass",
      description:
        "A complete training to improve your attention and execution.",
      instructor_id: 1,
    });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
  });

  await runCase("validateCourseData rejects invalid payload", () => {
    const result = validateCourseData({
      title: "No",
      description: "Too short",
      instructor_id: -1,
    });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.length, 3);
  });
}

if (process.argv[1].endsWith("course.test.js")) {
  runCourseTests().catch((err) => {
    console.error("Course validation tests failed", err);
    process.exit(1);
  });
}
