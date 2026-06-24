/**
 * PR Reviewer Agent
 *
 * Reviews your staged git changes (or a specific branch diff) and produces
 * a structured code review covering: bugs, security, performance, and suggestions.
 *
 * Usage:
 *   ts-node pr-reviewer.ts                        # reviews staged changes
 *   ts-node pr-reviewer.ts --branch feature/xyz   # reviews branch vs main
 *   ts-node pr-reviewer.ts --file src/routes/auth.routes.ts  # reviews one file
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { PROJECT_CONTEXT, ROOT_DIR } from "./project.context";

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const branchIdx = args.indexOf("--branch");
const fileIdx = args.indexOf("--file");
const branch = branchIdx !== -1 ? args[branchIdx + 1] : null;
const targetFile = fileIdx !== -1 ? args[fileIdx + 1] : null;

// ─── Get the diff to review ───────────────────────────────────────────────────
function getDiff(): string {
  try {
    if (targetFile) {
      return execSync(`git diff HEAD -- ${targetFile}`, { cwd: ROOT_DIR }).toString();
    }
    if (branch) {
      return execSync(`git diff main...${branch}`, { cwd: ROOT_DIR }).toString();
    }
    // Default: staged + unstaged changes
    const staged = execSync("git diff --cached", { cwd: ROOT_DIR }).toString();
    const unstaged = execSync("git diff", { cwd: ROOT_DIR }).toString();
    return staged + unstaged;
  } catch {
    console.error("❌ Could not get git diff. Make sure you're in a git repo.");
    process.exit(1);
  }
}

const diff = getDiff();

if (!diff.trim()) {
  console.log("✅ No changes to review.");
  process.exit(0);
}

// ─── Agent prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a senior full-stack engineer reviewing code for the Interview Simulator project.

${PROJECT_CONTEXT}

Your job is to produce a thorough but concise code review. Structure your output exactly like this:

## 🔴 Critical Issues
(Bugs, security holes, data loss risks — must fix before merging)

## 🟡 Warnings
(Performance problems, anti-patterns, missing error handling)

## 🟢 Suggestions
(Code quality, naming, architecture improvements — nice to have)

## ✅ What looks good
(Acknowledge solid work)

## 📋 Summary
One paragraph overall verdict and merge recommendation.

Rules:
- Be specific: quote line numbers and code snippets from the diff
- Flag any unhandled promise rejections or missing try/catch in async Express routes
- Check for JWT/auth middleware missing on protected routes
- Flag any AI provider calls without error handling
- Check for missing Mongoose schema validations
- Flag any hardcoded secrets or API keys
- For frontend: flag missing loading states, unhandled fetch errors, or missing subscription gates
`;

// ─── Run agent ────────────────────────────────────────────────────────────────
async function main() {
  const scope = targetFile ? `file: ${targetFile}` : branch ? `branch: ${branch}` : "staged/unstaged changes";
  console.log(`\n🔍 PR Reviewer Agent — reviewing ${scope}\n`);
  console.log("─".repeat(60));

  const prompt = `
Please review the following git diff for the Interview Simulator project.

\`\`\`diff
${diff.slice(0, 15000)} ${diff.length > 15000 ? "\n... (truncated)" : ""}
\`\`\`

Produce a structured code review following the format in your instructions.
`;

  for await (const message of query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: ["Read", "Glob", "Grep"],
      cwd: ROOT_DIR,
      permissionMode: "acceptEdits",
    },
  })) {
    if ("result" in message && message.result) {
      console.log("\n" + message.result);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log("✅ Review complete.\n");
}

main().catch(console.error);
