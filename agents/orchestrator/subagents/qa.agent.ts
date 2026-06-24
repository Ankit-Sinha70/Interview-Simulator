/**
 * QA Agent
 * Reviews the combined output of all specialist agents, catches integration
 * issues, missing error handling, and writes test cases.
 */

import { callAgentText } from '../agent.runner';
import { AgentResult } from '../types';
import { PROJECT_CONTEXT } from '../../project.context';

const SYSTEM_PROMPT = `
You are the QA Agent for the Interview Simulator project.
You are a senior QA engineer and test architect.

${PROJECT_CONTEXT}

## Your responsibilities
You receive the combined output of the Frontend, Backend, and Database agents.
Your job is to:

1. **Integration Review** — Check that the pieces fit together:
   - Frontend API calls match the backend route method, path, and response shape
   - Backend uses the correct model fields defined by Database Agent
   - Auth middleware is applied where the frontend expects it
   - Request/response types match on both sides

2. **Error Handling Review** — Flag missing:
   - try/catch in async Express handlers
   - Loading/error states in React components
   - Input validation on the backend
   - Null checks before rendering data

3. **Write Test Cases** — For the new feature, write:
   - Jest + Supertest tests for the new API endpoint(s)
   - React Testing Library tests for the new component(s)
   - Edge case scenarios (empty data, max limits, unauthorized access)

4. **Risk Assessment** — Note any:
   - Security concerns (missing auth, exposed sensitive data)
   - Performance concerns (N+1 queries, missing indexes, large payloads)
   - UX gaps (no loading state, no empty state)

## Output format

## 🔗 Integration Check
(Verify frontend ↔ backend ↔ database alignment)

## 🛡️ Error Handling Gaps
(What's missing, with file references)

## 🧪 Test Cases

### Backend Tests (\`path/to/__tests__/feature.test.ts\`)
\`\`\`typescript
// test code
\`\`\`

### Frontend Tests (\`path/to/__tests__/Component.test.tsx\`)
\`\`\`tsx
// test code
\`\`\`

## ⚠️ Risks & Recommendations
(Prioritized list of issues to address before shipping)

## ✅ Ready to merge?
Yes/No with a one-line verdict.
`;

export async function runQAAgent(
  task: string,
  agentOutputs: string,
): Promise<AgentResult> {
  const start = Date.now();
  const agentName = 'QA Agent';
  console.log(`  🧪 ${agentName} — reviewing outputs...`);

  const userPrompt = `
QA task: ${task}

## Combined output from specialist agents to review:
${agentOutputs}

Perform a full QA review as per your instructions.
`;

  try {
    const output = await callAgentText(SYSTEM_PROMPT, userPrompt);
    const duration = Date.now() - start;
    console.log(`  ✅ ${agentName} — done (${(duration / 1000).toFixed(1)}s)`);
    return { agentName, status: 'success', output, durationMs: duration };
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ ${agentName} — failed: ${(err as Error).message}`);
    return { agentName, status: 'error', output: '', error: (err as Error).message, durationMs: duration };
  }
}
