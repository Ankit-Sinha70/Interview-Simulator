import { Role, ExperienceLevel } from '../../models/interviewSession.model';

export interface HintContext {
    question: string;
    partialAnswer: string;
    role: Role | string;
    level: ExperienceLevel | string;
}

export function getHintPrompt(ctx: HintContext): string {
    return `You are providing real-time, lightweight feedback to a candidate currently typing an interview answer.
    
Context:
Role: ${ctx.role}
Level: ${ctx.level}
Question:
${ctx.question}

Current Partial Answer:
${ctx.partialAnswer}

Instructions:
1. Analyze the partial answer briefly.
2. Provide at most ONE concise, constructive hint.
3. Keep the hint extremely short (under 6 words). Examples: "Good structure", "Too long", "Add an example", "Define the core problem", "Missing edge cases", "Looking good", "Focus on scale".
4. If no hint is needed or the answer is too short to judge, return null for the hint.

Return STRICT JSON ONLY:
{
  "hint": "string or null"
}`;
}
