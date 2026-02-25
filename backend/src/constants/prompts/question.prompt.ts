import { ExperienceLevel, Difficulty } from '../../models/interviewSession.model';
import { getAllowedTopics, getForbiddenTopics, getDifficultyBand, getLevelConfig } from '../difficultyMatrix';

// ─── Level Descriptions ───

const LEVEL_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  Junior: 'Junior (0-2 years): Expects foundational knowledge, basic syntax, simple concepts. NO architecture, NO system design, NO advanced patterns.',
  Mid: 'Mid (2-5 years): Expects implementation details, reasoning, design patterns basics. NO deep system design, NO distributed systems.',
  Senior: 'Senior (5+ years): Expects architectural thinking, trade-offs, scalability, system design. Avoid trivial syntax or definition questions.',
};

// ─── Strict Rules per Level ───

const STRICT_RULES: Record<ExperienceLevel, string> = {
  Junior: `STRICT RULES FOR JUNIOR LEVEL:
- ONLY ask easy-level questions
- NO system design questions
- NO architecture scaling questions
- NO advanced design patterns
- NO performance optimization at deep level
- NO distributed systems concepts
- Focus on fundamentals and basics
- Questions should test understanding of basic concepts
- Keep question complexity appropriate for someone with 0-2 years experience
- If you are tempted to ask about advanced topics, DO NOT — ask a simpler variation instead
- The levelScore MUST be between 1 and 3`,

  Mid: `STRICT RULES FOR MID LEVEL:
- Ask easy-to-medium level questions
- Can include basic design patterns and architecture concepts
- NO deep system design
- NO distributed systems internals
- NO microservices architecture
- Focus on practical implementation and reasoning
- Questions should test applied knowledge
- The levelScore MUST be between 3 and 7`,

  Senior: `STRICT RULES FOR SENIOR LEVEL:
- Ask medium-to-hard level questions
- Focus on architecture, trade-offs, scalability
- Include system design and distributed thinking
- NO trivial syntax definition questions
- NO basic concept explanations
- Questions should test leadership-level technical thinking
- The levelScore MUST be between 6 and 10`,
};

export function getQuestionPrompt(params: {
  role: string;
  level: string;
  previousQuestion?: string;
  evaluationSummary?: string;
}): string {
  const level = params.level as ExperienceLevel;
  const allowedTopics = getAllowedTopics(params.role, level);
  const forbiddenTopics = getForbiddenTopics(params.role, level);
  const levelConfig = getLevelConfig(level);
  const band = levelConfig.difficultyBand;

  return `You are a senior technical interviewer.

Generate one interview question based on:

Role: ${params.role}
Experience Level: ${params.level}
${LEVEL_DESCRIPTIONS[level]}

Previous Question: ${params.previousQuestion || 'None (this is the first question)'}
Previous Answer Evaluation: ${params.evaluationSummary || 'None (this is the first question)'}

${STRICT_RULES[level]}

ALLOWED TOPICS (pick from these):
${allowedTopics.map((t: string) => `- ${t}`).join('\n')}

FORBIDDEN TOPICS (NEVER ask about these):
${forbiddenTopics.map((t: string) => `- ${t}`).join('\n')}

ALLOWED DIFFICULTY: ${levelConfig.allowedDifficulty.join(', ')} ONLY
DIFFICULTY SCORE RANGE: ${band.min} to ${band.max} (1=easiest, 10=hardest)

Rules:
- If this is the first question, generate a foundational but relevant question.
- If this is a follow-up, focus on weak areas or incomplete explanations.
- Keep question realistic and professional.
- The question difficulty MUST be one of: ${levelConfig.allowedDifficulty.join(', ')}.
- The topic MUST be from the ALLOWED TOPICS list.
- The topic MUST NOT be from the FORBIDDEN TOPICS list.
- If you generate a question that exceeds the allowed difficulty, REJECT it internally and generate a simpler one.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "question": string,
  "difficulty": "${levelConfig.allowedDifficulty.join('" | "')}",
  "levelScore": number (${band.min}-${band.max}),
  "topic": string
}`;
}
