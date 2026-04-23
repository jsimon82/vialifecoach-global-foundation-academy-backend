import runAuthTests from "./auth.test.mjs";
import runCourseTests from "./course.test.mjs";
import runSupportTests from "./support.test.mjs";

async function runSuite() {
  console.log("Starting backend unit tests");
  await runAuthTests();
  await runCourseTests();
  await runSupportTests();
  console.log("Backend unit tests completed successfully");
}

runSuite().catch((error) => {
  console.error("Backend unit tests failed", error);
  process.exit(1);
});
