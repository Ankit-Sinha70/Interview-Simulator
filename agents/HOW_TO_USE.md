# Interview Simulator — Development Agents

AI-powered agents that help you build, review, and maintain this project.
Each agent is a TypeScript script powered by the **Claude Agent SDK**.

---

## Setup (one-time)

```bash
cd agents
npm install
```

Set your Anthropic API key:
```bash
# Mac/Linux
export ANTHROPIC_API_KEY=your-key-here

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="your-key-here"
```

Get your API key from: https://platform.claude.com/

---

## 1. PR Reviewer — `pr-reviewer.ts`

Reviews code changes before you merge them. Flags bugs, security issues, and improvements.

```bash
# Review your current staged/unstaged changes
npx ts-node pr-reviewer.ts

# Review a specific branch vs main
npx ts-node pr-reviewer.ts --branch ankit/new-feature

# Review a single file
npx ts-node pr-reviewer.ts --file backend/src/routes/auth.routes.ts
```

**Output:** Structured review with 🔴 Critical / 🟡 Warnings / 🟢 Suggestions + merge recommendation.

---

## 2. Error Handler — `error-handler.ts`

Scans the codebase for unhandled errors, missing try/catch, and risky edge cases.

```bash
# Scan entire project and report issues
npx ts-node error-handler.ts

# Scan a specific directory
npx ts-node error-handler.ts --dir backend/src/ai

# Scan and auto-fix safe issues (adds try/catch, null checks)
npx ts-node error-handler.ts --fix
```

**Output:** Prioritized report of 🔴 Critical / 🟡 Warning / 🟢 Info issues with file + line numbers.

---

## 3. Feature Implementer — `feature-implementer.ts`

Describe a feature in plain English — the agent reads your codebase, plans, and implements it end-to-end (backend route + controller + service + frontend component).

```bash
# Implement a feature end-to-end
npx ts-node feature-implementer.ts --feature "Add a leaderboard showing top 10 users by interview score"

npx ts-node feature-implementer.ts --feature "Send email when interview report is ready"

npx ts-node feature-implementer.ts --feature "Add notes field to interview session so users can annotate their answers"

# See the plan first without writing any code
npx ts-node feature-implementer.ts --plan-only --feature "Add export to PDF for interview reports"
```

**Tip:** Use `--plan-only` first to review what the agent will do before it writes anything.

---

## 4. Test Writer — `test-writer.ts`

Reads your existing code and generates Jest tests (supertest for backend routes, RTL for React components).

```bash
# Write tests for a specific file
npx ts-node test-writer.ts --target backend/src/routes/auth.routes.ts
npx ts-node test-writer.ts --target backend/src/ai/evaluation.engine.ts
npx ts-node test-writer.ts --target frontend/src/components/QuestionCard.tsx

# Write tests for an entire scope
npx ts-node test-writer.ts --scope routes       # all backend routes
npx ts-node test-writer.ts --scope ai           # all AI engines
npx ts-node test-writer.ts --scope services     # all services
npx ts-node test-writer.ts --scope components   # all React components
```

---

## How they work

Each agent uses the **Claude Agent SDK** to autonomously read your files, understand your project's conventions, and act. The `project.context.ts` file gives every agent a shared understanding of your architecture so output is always tailored to this project — not generic advice.

```
Claude Agent SDK
       │
       ├── Reads your files (Read, Glob, Grep tools)
       ├── Understands your conventions (project.context.ts)
       ├── Writes/edits code (Write, Edit tools)
       └── Runs shell commands (Bash tool)
```

To adjust how agents behave, edit the `SYSTEM_PROMPT` constant inside each agent file.
To update project context (e.g. after adding a new module), edit `project.context.ts`.
