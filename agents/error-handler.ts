/**
 * Error Handler Agent
 *
 * Scans your codebase for unhandled errors, missing try/catch blocks,
 * unhandled promise rejections, and risky edge cases. Outputs a prioritized
 * report and optionally auto-fixes safe issues.
 *
 * Usage:
 *   ts-node error-handler.ts                        # scans entire project
 *   ts-node error-handler.ts --dir backend/src/ai   # scans a specific directory
 *   ts-node error-handler.ts --fix                  # scan + auto-fix safe issues
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { PROJECT_CONTEXT, ROOT_DIR } from "./project.context";

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dirIdx = args.indexOf("--dir");
const shouldFix = args.includes("--fix");
const targetDir = dirIdx !== -1 ? args[dirIdx + 1] : null;

const scanTarget = targetDir
  ? `${ROOT_DIR}/${targetDir}`
  : ROOT_DIR;

// ─── Agent System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a senior backend and frontend engineer specializing in error handling and reliability.

${PROJECT_CONTEXT}

Your mission: scan the codebase for error handling gaps and produce a prioritized fix report.

## What to look for

### Backend (Express/TypeScript)
1. Async route handlers with no try/catch (will cause unhandled rejections in Express)
2. MongoDB queries with no error handling (.find(), .save(), etc.)
3. AI provider calls (callAI()) with no error handling — these can throw on rate limit/timeout
4. JWT verification without try/catch (jwt.verify throws on invalid tokens)
5. Missing 404/500 fallback in route handlers
6. Multer file upload handlers without error handling
7. Nodemailer sends without error handling
8. Stripe API calls without error handling

### Frontend (Next.js/React)
1. fetch() calls with no .catch() or try/catch
2. Missing loading and error states in components
3. useEffect hooks that call async functions without error handling
4. Missing null checks on API response data before rendering
5. Unhandled promise rejections in event handlers

## Output format

### 🔴 CRITICAL — Fix immediately
(Unhandled errors that will crash the server or break user flows)
For each: file path, line number, the problem, and the fix

### 🟡 WARNING — Fix soon
(Silent failures, poor UX, data corruption risks)
For each: file path, line number, the problem, and the fix

### 🟢 INFO — Nice to have
(Defensive coding improvements)

### 📊 Summary
Total issues found, files scanned, recommended priority order.

${shouldFix ? `
## Auto-fix mode ON
After the report, fix all CRITICAL issues automatically.
Only make targeted changes — wrap the problematic code in try/catch, add .catch() handlers,
or add null checks. Do not refactor unrelated code.
` : `
## Scan-only mode
Report issues only. Do not modify any files.
`}
`;

// ─── Run agent ────────────────────────────────────────────────────────────────
async function main() {
  const mode = shouldFix ? "scan + auto-fix" : "scan only";
  const scope = targetDir || "entire project";
  console.log(`\n🛡️  Error Handler Agent — ${mode} | scope: ${scope}\n`);
  console.log("─".repeat(60));

  const prompt = `
Scan the codebase at: ${scanTarget}

Focus on these directories:
- ${ROOT_DIR}/backend/src/routes/
- ${ROOT_DIR}/backend/src/controllers/
- ${ROOT_DIR}/backend/src/services/
- ${ROOT_DIR}/backend/src/ai/
- ${ROOT_DIR}/frontend/src/app/
- ${ROOT_DIR}/frontend/src/components/

${targetDir ? `Actually only scan: ${scanTarget}` : ""}

Steps:
1. Use Glob to find all .ts and .tsx files (exclude node_modules, dist, .next)
2. Use Read to examine each file
3. Identify all error handling gaps using the categories in your instructions
4. Produce the prioritized report
${shouldFix ? "5. Then fix all CRITICAL issues by editing the files" : ""}
`;

  for await (const message of query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: shouldFix
        ? ["Read", "Edit", "Glob", "Grep"]
        : ["Read", "Glob", "Grep"],
      cwd: ROOT_DIR,
      permissionMode: shouldFix ? "acceptEdits" : "default",
    },
  })) {
    if ("result" in message && message.result) {
      console.log("\n" + message.result);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`✅ Error scan complete.${shouldFix ? " Fixes applied." : ""}\n`);
}

main().catch(console.error);
