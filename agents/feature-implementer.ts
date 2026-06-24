/**
 * Feature Implementer Agent
 *
 * Takes a plain-English feature description and implements it end-to-end
 * across your backend (routes, controller, service, model) and frontend
 * (page, component, API call) following your project's existing conventions.
 *
 * Usage:
 *   ts-node feature-implementer.ts --feature "Add a leaderboard showing top users by interview score"
 *   ts-node feature-implementer.ts --feature "Send email notification when interview report is ready"
 *   ts-node feature-implementer.ts --feature "Add dark/light mode toggle to settings page"
 *   ts-node feature-implementer.ts --plan-only --feature "..."  # show plan without writing code
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { PROJECT_CONTEXT, ROOT_DIR } from "./project.context";

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const featureIdx = args.indexOf("--feature");
const planOnly = args.includes("--plan-only");

if (featureIdx === -1 || !args[featureIdx + 1]) {
  console.error('❌ Usage: ts-node feature-implementer.ts --feature "your feature description"');
  process.exit(1);
}

const featureRequest = args[featureIdx + 1];

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a senior full-stack engineer implementing features for the Interview Simulator project.

${PROJECT_CONTEXT}

## Your implementation process

### Step 1 — Explore first
Before writing any code, use Read, Glob, and Grep to understand:
- Existing similar features for patterns to follow
- Relevant models and their schemas
- Existing routes and how they're structured
- Relevant frontend components and hooks

### Step 2 — Plan
Write a clear implementation plan:
- What files will be created or modified
- What the data model changes are (if any)
- API endpoint design (method, path, request/response shape)
- Frontend components needed

### Step 3 — Implement
Follow these conventions exactly:

**Backend conventions:**
- Routes in backend/src/routes/*.routes.ts (use express Router)
- Controllers in backend/src/controllers/ (thin — delegate to service)
- Services in backend/src/services/ (business logic here)
- Models in backend/src/models/ with proper Mongoose validation
- Register new routes in backend/src/app.ts
- Wrap all async operations in try/catch and use next(error) pattern
- Protect routes with auth middleware where needed
- If the feature needs AI, add a new engine in backend/src/ai/ using callAI<T>()

**Frontend conventions:**
- Pages in frontend/src/app/(app)/ for authenticated, (marketing)/ for public
- Components in frontend/src/components/ grouped by feature
- Use Tailwind CSS for styling (no inline styles)
- Use sonner for toast notifications (import { toast } from 'sonner')
- Use Lucide React for icons
- Always handle loading and error states in components
- Gate premium features with the LockedSection component
- API calls should use NEXT_PUBLIC_API_URL env variable

### Step 4 — Verify
After implementing, use Grep to check:
- The new route is registered in app.ts
- Imports are correct
- No TypeScript obvious errors

${planOnly ? `
## PLAN ONLY MODE
Write the full plan in Step 2 but DO NOT create or edit any files.
Just output what you would do and why.
` : `
## IMPLEMENT MODE
Execute all 4 steps. Write the actual code.
`}
`;

// ─── Run agent ────────────────────────────────────────────────────────────────
async function main() {
  const mode = planOnly ? "plan only" : "full implementation";
  console.log(`\n🚀 Feature Implementer Agent — ${mode}\n`);
  console.log(`📝 Feature: "${featureRequest}"\n`);
  console.log("─".repeat(60));

  const prompt = `
Implement the following feature for the Interview Simulator project:

"${featureRequest}"

Working directory: ${ROOT_DIR}

Follow your 4-step process:
1. Explore the codebase to understand patterns
2. Write the implementation plan
3. ${planOnly ? "STOP HERE — do not write any code" : "Implement the feature end-to-end"}
4. ${planOnly ? "" : "Verify imports and registrations are correct"}
`;

  for await (const message of query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: planOnly
        ? ["Read", "Glob", "Grep"]
        : ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
      cwd: ROOT_DIR,
      permissionMode: "acceptEdits",
    },
  })) {
    if ("result" in message && message.result) {
      console.log("\n" + message.result);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`✅ Feature ${planOnly ? "plan" : "implementation"} complete.\n`);
}

main().catch(console.error);
