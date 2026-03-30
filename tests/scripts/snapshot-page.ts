/**
 * CLI Snapshot Helper — Token-efficient page inspection
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
 *   tests/snapshots/<name>.json  — Full accessibility tree (read only when you need element refs)
 *   tests/snapshots/<name>.summary.txt — Lightweight role/name summary (read this first)
 *   tests/screenshots/<name>.png — Full-page screenshot
 *
 * Workflow:
 *   1. Run this script to capture the page state
 *   2. Read the .summary.txt to understand what's on the page
 *   3. Only open the full .json when you need an exact element to interact with
 *   4. Use role + name from the summary to build Playwright locators:
 *      page.getByRole('button', { name: 'Confirm Order' })
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

// Derive a filename from the URL or use provided suffix
function urlToName(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  const slug = (parsed.pathname === "/" ? "home" : parsed.pathname)
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    || "page";
  return slug;
}

const name = nameSuffix ?? urlToName(url);
const snapshotsDir = path.join(process.cwd(), "tests", "snapshots");
const screenshotsDir = path.join(process.cwd(), "tests", "screenshots");

fs.mkdirSync(snapshotsDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });

type AXNode = {
  role?: string;
  name?: string;
  description?: string;
  children?: AXNode[];
  [key: string]: unknown;
};

function buildSummary(node: AXNode, depth = 0): string[] {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  const role = node.role ?? "unknown";
  const label = node.name ? ` "${node.name}"` : "";
  const desc = node.description ? ` [${node.description}]` : "";
  if (role !== "none" && role !== "generic") {
    lines.push(`${indent}${role}${label}${desc}`);
  }
  for (const child of node.children ?? []) {
    lines.push(...buildSummary(child, depth + (role !== "none" && role !== "generic" ? 1 : 0)));
  }
  return lines;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle" });

  // Full accessibility tree
  const snapshot = await page.accessibility.snapshot({ interestingOnly: false });

  // Full-page screenshot
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);

  await browser.close();

  // Save full snapshot JSON
  const snapshotPath = path.join(snapshotsDir, `${name}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`Full snapshot saved: ${snapshotPath}`);

  // Save lightweight summary
  const summary = snapshot ? buildSummary(snapshot as AXNode) : ["(empty)"];
  const summaryPath = path.join(snapshotsDir, `${name}.summary.txt`);
  fs.writeFileSync(summaryPath, summary.join("\n"), "utf-8");
  console.log(`Summary saved: ${summaryPath}`);

  // Print summary to stdout so Claude sees it inline (without loading the full JSON)
  console.log("\n--- Page Summary ---");
  console.log(summary.slice(0, 60).join("\n"));
  if (summary.length > 60) {
    console.log(`... (${summary.length - 60} more lines in ${summaryPath})`);
  }
})();
