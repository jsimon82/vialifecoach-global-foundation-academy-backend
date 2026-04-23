import fs from "fs";
import path from "path";
import os from "os";

const storagePaths = [
  path.join(os.homedir(), "AppData", "Roaming", "Code", "User", "globalStorage"),
  path.join(os.homedir(), ".vscode", "extensions")
];

let recovered = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const full = path.join(dir, item);

    try {
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        scanDirectory(full);
      }

      if (item.endsWith(".json")) {
        const content = fs.readFileSync(full, "utf8");

        if (
          content.toLowerCase().includes("codex") ||
          content.toLowerCase().includes("fix all problems") ||
          content.toLowerCase().includes("activity")
        ) {
          recovered.push({
            file: full,
            snippet: content.substring(0, 500)
          });
        }
      }
    } catch (err) {}
  }
}

console.log("Scanning VS Code storage...");

storagePaths.forEach(scanDirectory);

const output = path.join(process.cwd(), "recovered-codex-history.json");

fs.writeFileSync(output, JSON.stringify(recovered, null, 2));

console.log("\nRecovery complete.");
console.log("Recovered data saved to:");
console.log(output);