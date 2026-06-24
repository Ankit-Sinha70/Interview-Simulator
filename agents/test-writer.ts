/**
 * Test Writer Agent
 *
 * Reads your existing code and generates comprehensive tests using Jest
 * (backend: supertest for API routes; frontend: React Testing Library).
 * Tests are written following your project's conventions and placed in
 * the correct __tests__ directories.
 *
 * Usage:
 *   ts-node test-writer.ts --target backend/src/routes/auth.routes.ts
 *   ts-node test-writer.ts --target backend/src/ai/evaluation.engine.ts
 *   ts-node test-writer.ts --target frontend/src/components/QuestionCard.tsx
 *   ts-node test-writer.ts --scope backend   # generates tests for all backend routes
 *   ts-node test-writer.ts --scope ai        # generates tests for all AI engines
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { PROJECT_CONTEXT, ROOT_DIR } from "./project.context";

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const targetIdx = args.indexOf("--target");
const scopeIdx = args.indexOf("--scope");
const targetFile = targetIdx !== -1 ? args[targetIdx + 1] : null;
const scope = scopeIdx !== -1 ? args[scopeIdx + 1] : null;

if (!targetFile && !scope) {
  console.error("❌ Usage:");
  console.error("  ts-node test-writer.ts --target path/to/file.ts");
  console.error("  ts-node test-writer.ts --scope backend|frontend|ai|routes");
  process.exit(1);
}

// ─── Scope → directory mapping ────────────────────────────────────────────────
const SCOPE_MAP: Record<string, string> = {
  backend: "backend/src",
  frontend: "frontend/src",
  ai: "backend/src/ai",
  routes: "backend/src/routes",
  controllers: "backend/src/controllers",
  services: "backend/src/services",
  components: "frontend/src/components",
};

const scanDir = scope ? `${ROOT_DIR}/${SCOPE_MAP[scope] ?? scope}` : null;
const scanFile = targetFile ? `${ROOT_DIR}/${targetFile}` : null;

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a senior engineer writing tests for the Interview Simulator project.

${PROJECT_CONTEXT}

## Testing stack
- Backend: Jest + Supertest (for HTTP routes), ts-jest for TypeScript
- Frontend: Jest + React Testing Library + @testing-library/user-event
- Mocking: jest.mock() for external deps (mongoose, stripe, nodemailer, AI providers)

## Test file placement
- Backend tests → same directory as source, named *.test.ts
  e.g. backend/src/routes/__tests__/auth.routes.test.ts
- Frontend tests → co-located with component, named *.test.tsx
  e.g. frontend/src/components/__tests__/QuestionCard.test.tsx

## What to test

### For Express routes (use supertest):
- Happy path (200/201 with correct response shape)
- Auth failures (401 when token missing/invalid)
- Validation errors (400 with bad input)
- Not found (404)
- Server errors (500) — mock the service to throw

### For AI engines:
- Returns correct shape when provider responds normally
- Throws / returns error when provider fails
- Prompt content includes expected variables

### For Services:
- Correct DB calls are made (mock mongoose models)
- Business logic conditions (subscription checks, limits, etc.)
- Error propagation

### For React components:
- Renders without crashing
- Shows loading state while fetching
- Renders data correctly after fetch resolves
- Shows error state on fetch failure
- User interactions (click, type, submit) trigger correct callbacks

## Code conventions
- Use describe() blocks grouped by function/endpoint
- Use beforeEach() to reset mocks
- Use meaningful test names: it('should return 401 when token is missing')
- Mock mongoose with jest.mock('mongoose') or use in-memory mongodb
- Mock AI providers: jest.mock('../ai/provider.factory', () => ({ callAI: jest.fn() }))
- Mock Stripe: jest.mock('stripe')
- Always assert response status AND body shape
- Add at least one edge case per function

## Output
Write the complete test file content. Include all imports.
Explain briefly what each describe block covers with a comment.
After writing, confirm the file was saved at the correct path.
`;

// ─── Run agent ────────────────────────────────────────────────────────────────
async function main() {
  const description = targetFile
    ? `file: ${targetFile}`
    : `scope: ${scope} (${SCOPE_MAP[scope!] ?? scope})`;

  console.log(`\n🧪 Test Writer Agent — ${description}\n`);
  console.log("─".repeat(60));

  const prompt = targetFile
    ? `
Read the file at: ${scanFile}
Also read related files it imports (models, services, controllers) to understand the full context.

Then write a comprehensive test file for it.
Place the test file at the correct __tests__ location relative to the source file.
`
    : `
Scan all TypeScript files in: ${scanDir}

For each file:
1. Read it to understand what it does
2. Write tests for it
3. Save the test file in the correct __tests__ directory

Prioritize:
- Route files (test all endpoints)
- AI engine files (test input/output contracts)
- Service files with complex business logic

Skip: index files, type-only files, config files.
`;

  for await (const message of query({
    prompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      allowedTools: ["Read", "Write", "Glob", "Grep", "Bash"],
      cwd: ROOT_DIR,
      permissionMode: "acceptEdits",
    },
  })) {
    if ("result" in message && message.result) {
      console.log("\n" + message.result);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log("✅ Tests written.\n");
}

main().catch(console.error);
