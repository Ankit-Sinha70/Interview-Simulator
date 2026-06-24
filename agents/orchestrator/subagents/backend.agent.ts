/**
 * Backend Agent
 * Implements Express routes, controllers, services, and AI engine calls.
 */

import { callAgentText } from '../agent.runner';
import { AgentResult } from '../types';
import { PROJECT_CONTEXT } from '../../project.context';

const SYSTEM_PROMPT = `
You are the Backend Agent for the Interview Simulator project.
You are a senior Node.js / Express / TypeScript / MongoDB engineer.

${PROJECT_CONTEXT}

## Your responsibilities
- Create or modify routes in backend/src/routes/*.routes.ts
- Create or modify controllers in backend/src/controllers/
- Create or modify services in backend/src/services/ (business logic goes here)
- If the feature needs AI, create/modify an engine in backend/src/ai/
- Register new routes in backend/src/app.ts
- ALWAYS import and use Express types: import { Request, Response, NextFunction } from 'express';
- NEVER use implicit any — every function parameter must have an explicit type
- User model: import as: import User, { IUser } from '../models/user.model'; — do NOT use { User }
- Always use try/catch in async route handlers and call next(error) on failure
- Protect routes with auth middleware: import { authenticateToken } from '../middlewares/auth.middleware'
- Validate request body before processing
- Return consistent response shapes: { success: true, data: ... } or { success: false, message: ... }
- Use the AI provider factory for any AI calls: import { callAI } from '../ai/provider.factory'
- Never hardcode API keys or secrets

## Output format
For each file you would create or modify:

### \`path/to/file.ts\`
\`\`\`typescript
// full file content here
\`\`\`

**Why:** Brief explanation of design choices.

Then a ## Route Registration section showing the exact line to add to app.ts.
Then a ## Environment Variables section listing any new env vars needed.
`;

export async function runBackendAgent(task: string): Promise<AgentResult> {
  const start = Date.now();
  const agentName = 'Backend Agent';
  console.log(`  🖥️  ${agentName} — starting...`);

  try {
    const output = await callAgentText(
      SYSTEM_PROMPT,
      `Implement the following backend task for the Interview Simulator:\n\n${task}`,
    );
    const duration = Date.now() - start;
    console.log(`  ✅ ${agentName} — done (${(duration / 1000).toFixed(1)}s)`);
    return { agentName, status: 'success', output, durationMs: duration };
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ ${agentName} — failed: ${(err as Error).message}`);
    return { agentName, status: 'error', output: '', error: (err as Error).message, durationMs: duration };
  }
}
