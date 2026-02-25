import { Role, ExperienceLevel, Difficulty, FollowUpIntent } from '../../models/interviewSession.model';
import { getAllowedTopics, getForbiddenTopics, getLevelConfig } from '../difficultyMatrix';

export interface FollowUpContext {
   role: Role | string;
   experienceLevel: ExperienceLevel;
   previousQuestion: string;
   previousTopic: string;
   previousDifficulty: Difficulty;
   technicalScore: number;
   depthScore: number;
   clarityScore: number;
   problemSolvingScore: number;
   communicationScore: number;
   weaknesses: string[];
   followUpIntent: FollowUpIntent;
   targetDifficulty: Difficulty;
   questionHistory: string[];
}

// ─── Level-Specific Follow-Up Rules ───

const FOLLOWUP_LEVEL_RULES: Record<ExperienceLevel, string> = {
   Junior: `JUNIOR-LEVEL FOLLOW-UP RULES:
- Even for ESCALATE_DIFFICULTY intent, the difficulty MUST remain "easy"
- Use harder sub-variants of easy questions instead of jumping to medium
- For example: instead of asking about architecture, ask a more complex basic question
- NEVER ask about system design, scalability, or architecture
- NEVER generate a "medium" or "hard" difficulty question
- The levelScore MUST be between 1 and 3
- Escalation means: from basic recall → to basic application → to basic scenario, NOT to advanced concepts`,

   Mid: `MID-LEVEL FOLLOW-UP RULES:
- Difficulty MUST be "easy" or "medium" only
- NEVER generate a "hard" difficulty question
- For ESCALATE_DIFFICULTY intent, cap at "medium"
- The levelScore MUST be between 3 and 7
- Can include moderate patterns and practical scenarios`,

   Senior: `SENIOR-LEVEL FOLLOW-UP RULES:
- Difficulty MUST be "medium" or "hard" only
- NEVER generate an "easy" difficulty question
- NEVER ask basic syntax or definition questions
- The levelScore MUST be between 6 and 10
- For CLARIFY_TECHNICAL intent, keep the difficulty at "medium" minimum
- Focus on architecture, trade-offs, and system-level thinking`,
};

export function getFollowUpPrompt(ctx: FollowUpContext): string {
   const level = ctx.experienceLevel;
   const allowedTopics = getAllowedTopics(ctx.role as string, level);
   const forbiddenTopics = getForbiddenTopics(ctx.role as string, level);
   const levelConfig = getLevelConfig(level);
   const band = levelConfig.difficultyBand;

   return `You are a senior technical interviewer conducting a realistic interview.

Generate a follow-up question based on the candidate's previous performance.

Context:
Role: ${ctx.role}
Experience Level: ${ctx.experienceLevel}
Previous Question: "${ctx.previousQuestion}"
Previous Topic: ${ctx.previousTopic}
Previous Difficulty: ${ctx.previousDifficulty}

Evaluation Summary:
Technical Score: ${ctx.technicalScore}
Depth Score: ${ctx.depthScore}
Clarity Score: ${ctx.clarityScore}
Problem Solving Score: ${ctx.problemSolvingScore}
Communication Score: ${ctx.communicationScore}

Identified Weaknesses:
${ctx.weaknesses.join(', ')}

Follow-up Intent:
${ctx.followUpIntent}

Target Difficulty:
${ctx.targetDifficulty}

Previous Questions Asked (DO NOT REPEAT):
${ctx.questionHistory.map((q: string) => `- ${q}`).join('\n')}

${FOLLOWUP_LEVEL_RULES[level]}

ALLOWED DIFFICULTY: ${levelConfig.allowedDifficulty.join(', ')} ONLY
DIFFICULTY SCORE RANGE: ${band.min} to ${band.max}

ALLOWED TOPICS:
${allowedTopics.map((t: string) => `- ${t}`).join('\n')}

FORBIDDEN TOPICS (NEVER use):
${forbiddenTopics.map((t: string) => `- ${t}`).join('\n')}

Instructions:

1. If Follow-up Intent is CLARIFY_TECHNICAL:
   - Ask a focused question correcting the technical misunderstanding.
   - Keep same topic.
   - Do not change topic.

2. If Follow-up Intent is PROBE_DEPTH:
   - Ask a deeper conceptual question within the ALLOWED difficulty range.
   - Explore trade-offs, internal mechanics, or edge cases appropriate for ${ctx.experienceLevel} level.

3. If Follow-up Intent is SCENARIO_BASED:
   - Present a real-world problem scenario appropriate for ${ctx.experienceLevel} level.
   - Require structured thinking.

4. If Follow-up Intent is ESCALATE_DIFFICULTY:
   - Increase complexity WITHIN the allowed difficulty band.
   - NEVER exceed the allowed difficulty: ${levelConfig.allowedDifficulty.join(', ')}.

General Rules:
- Do not repeat previous questions.
- Do not generate a question semantically similar to any in Previous Questions Asked.
- Keep the question concise but meaningful.
- Maintain professional interview tone.
- The difficulty MUST be one of: ${levelConfig.allowedDifficulty.join(', ')}.
- The topic MUST be from the ALLOWED TOPICS list.
- The topic MUST NOT be from the FORBIDDEN TOPICS list.
- Ensure it is appropriate for ${ctx.experienceLevel} level.
- If you are tempted to exceed the difficulty band, generate a simpler alternative instead.

Return STRICT JSON only:

{
  "question": string,
  "topic": string,
  "difficulty": "${levelConfig.allowedDifficulty.join('" | "')}",
  "levelScore": number (${band.min}-${band.max}),
  "intent": "${ctx.followUpIntent}"
}`;
}
