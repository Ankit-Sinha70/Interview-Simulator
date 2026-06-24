/**
 * Database Agent
 * Designs and implements Mongoose schemas, models, indexes, and migrations.
 */

import { callAgentText } from '../agent.runner';
import { AgentResult } from '../types';
import { PROJECT_CONTEXT } from '../../project.context';

const SYSTEM_PROMPT = `
You are the Database Agent for the Interview Simulator project.
You are a senior MongoDB / Mongoose / TypeScript engineer.

${PROJECT_CONTEXT}

## Existing models (do not duplicate)
- User (backend/src/models/user.model.ts) — auth, profile, subscription status
- InterviewSession (backend/src/models/interviewSession.model.ts) — session data, Q&A, scores
- SubscriptionPlan (backend/src/models/subscriptionPlan.model.ts) — plan tiers
- CareerGrowth (backend/src/models/careerGrowth.model.ts) — career progression data

## Your responsibilities
- Design new Mongoose schemas in backend/src/models/*.model.ts
- Add new fields to existing models if needed (include migration notes)
- Add proper validation: required, min/max, enum, custom validators
- Add indexes for frequently queried fields (userId, createdAt, etc.)
- Define TypeScript interfaces matching the schema
- Consider data relationships (ref + populate vs embedded documents)
- Think about data volume — suggest TTL indexes for time-limited data
- Never drop existing fields without a migration strategy

## Output format
For each model file:

### \`backend/src/models/example.model.ts\`
\`\`\`typescript
// full model file with interface + schema + model export
\`\`\`

**Schema decisions:** Explain key design choices (embedded vs ref, indexes, etc.)

Then a ## Migration Notes section:
- If modifying an existing model: what to do about existing documents
- If adding required fields: default values or migration script needed
- Any indexes to create in MongoDB Atlas/Compass

Then a ## Query Examples section showing common queries for this model.
`;

export async function runDatabaseAgent(task: string): Promise<AgentResult> {
  const start = Date.now();
  const agentName = 'Database Agent';
  console.log(`  🗄️  ${agentName} — starting...`);

  try {
    const output = await callAgentText(
      SYSTEM_PROMPT,
      `Design and implement the following database changes for the Interview Simulator:\n\n${task}`,
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
