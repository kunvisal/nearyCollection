/**
 * CLI snapshot helper - token-efficient page inspection
 *
 * Usage:
 *   npx ts-node tests/scripts/snapshot-page.ts <url> [output-name]
 *
 * Examples:
 *   npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000
 *   npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000/checkout checkout
 *   npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000/admin/orders admin-orders
 *
 * Output:
 *   tests/snapshots/<name>.yaml - Full page snapshot
 *   tests/snapshots/<name>.summary.txt - Lightweight summary (read this first)
 *   tests/screenshots/<name>.png - Full-page screenshot
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const url = process.argv[2];
const nameSuffix = process.argv[3];

if (!url) {
  console.error("Usage: npx ts-node tests/scripts/snapshot-page.ts <url> [output-name]");
  process.exit(1);
}

// Derive a filename from the URL or use provided suffix.
function urlToName(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  const slug =
    (parsed.pathname === "/" ? "home" : parsed.pathname)
      .replace(/^\//, "")
      .replace(/\//g, "-")
      .replace(/[^a-z0-9-]/gi, "") || "page";
  return slug;
}

const name = nameSuffix ?? urlToName(url);
const snapshotsDir = path.join(process.cwd(), "tests", "snapshots");
const screenshotsDir = path.join(process.cwd(), "tests", "screenshots");

fs.mkdirSync(snapshotsDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });

type SnapshotCapablePage = {
  ariaSnapshot?: () => Promise<string>;
  accessibility?: {
    snapshot: (options?: { interestingOnly?: boolean }) => Promise<unknown>;
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle" });

  const compatiblePage = page as unknown as SnapshotCapablePage;
  let snapshotText = "";

  if (typeof compatiblePage.ariaSnapshot === "function") {
    // Newer Playwright versions.
    snapshotText = await compatiblePage.ariaSnapshot();
  } else if (compatiblePage.accessibility?.snapshot) {
    // Legacy Playwright API.
    const legacySnapshot = await compatiblePage.accessibility.snapshot({ interestingOnly: false });
    snapshotText = JSON.stringify(legacySnapshot ?? {}, null, 2);
  } else {
    // Last-resort fallback that still provides context for quick debugging.
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    const lines = bodyText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 500);
    snapshotText = lines.length > 0 ? lines.join("\n") : "(empty page text snapshot)";
  }

  // Full-page screenshot
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);

  await browser.close();

  // Save full snapshot
  const snapshotPath = path.join(snapshotsDir, `${name}.yaml`);
  fs.writeFileSync(snapshotPath, snapshotText, "utf-8");
  console.log(`Full snapshot saved: ${snapshotPath}`);

  // Build lightweight summary: first 60 non-empty lines.
  const allLines = snapshotText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const summary = allLines.length > 0 ? allLines : ["(empty)"];
  const summaryPath = path.join(snapshotsDir, `${name}.summary.txt`);
  fs.writeFileSync(summaryPath, summary.join("\n"), "utf-8");
  console.log(`Summary saved: ${summaryPath}`);

  // Print summary to stdout for quick terminal review.
  console.log("\n--- Page Summary ---");
  console.log(summary.slice(0, 60).join("\n"));
  if (summary.length > 60) {
    console.log(`... (${summary.length - 60} more lines in ${summaryPath})`);
  }
})();
