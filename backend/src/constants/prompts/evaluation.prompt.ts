import { Role, ExperienceLevel, VoiceMetadata } from '../../models/interviewSession.model';

export interface EvaluationContext {
   question: string;
   answer: string;
   role: Role | string;
   level: ExperienceLevel | string;
   interviewStyle?: string;
   companyStyle?: string;
   voiceMeta?: VoiceMetadata;
   parsedResume?: any;
}

export function getEvaluationPrompt(ctx: EvaluationContext): string {
   return `You are an experienced technical interviewer.

Your task is to evaluate the candidate’s answer objectively.

Interview Style: ${ctx.interviewStyle || 'friendly'}
Company Style: ${ctx.companyStyle || 'general'}
If the Company Style is "google", prioritize deep technical exactness and scalability understanding.
If the Company Style is "startup", prioritize whether the answer is practically "good enough" to ship.
If the Interview Style is "strict" or "faang", be nitpicky and do not give the benefit of the doubt.
If the Interview Style is "friendly", frame improvements constructively and acknowledge effort.

Context:
Role: ${ctx.role}
Experience Level: ${ctx.level}

Question:
${ctx.question}

Candidate Answer:
${ctx.answer}

Evaluation Guidelines:

1. Technical Accuracy:
   - Check correctness of concepts.
   - Identify any incorrect statements.
   - Penalize factual errors significantly.

2. Depth of Knowledge:
   - Evaluate whether the candidate explained underlying mechanisms.
   - Look for trade-offs, edge cases, or architectural thinking.
   - Penalize shallow definitions.

3. Problem-Solving Approach:
   - Assess logical structure.
   - Check if reasoning was step-by-step.
   - Reward structured thinking.

4. Clarity:
   - Is the explanation organized?
   - Is it easy to understand?
   - Is it coherent?

5. Communication Quality:
   - Professional tone?
   - Concise but complete?
   - Clear articulation of ideas?

${ctx.parsedResume ? `6. Resume Gap Detection (CRITICAL for Resume Interviews):
   CANDIDATE'S RESUME DATA:
   ${JSON.stringify(ctx.parsedResume, null, 2)}
   - Verify if their answer demonstrates the expertise they claim in their resume.
   - If they claim Senior/Expert level in a technology but give a Junior-level answer, heavily penalize.
   - Explicitly mention in "weaknesses" or "improvements" if there is a gap between their stated experience and their actual answer (e.g. "You claimed extensive Node.js experience at ABC Corp, but your answer lacked basic understanding of event loops.").
   - If their answer strongly validates their resume claims, commend them in "strengths".` : ''}

Experience-Level Adjustment:
- Junior (0-2 years):
  * Expect foundational understanding of concepts.
  * Good answers demonstrate basic syntax knowledge, simple use-case awareness.
  * Do NOT penalize for lack of deep architectural knowledge.
  * Do NOT expect system design thinking.
  * A Junior who explains basics correctly and clearly should score 7+.
  * Depth score should be evaluated relative to Junior expectations (basics only).
- Mid (2-5 years):
  * Expect implementation details and reasoning.
  * Good answers include practical examples, pattern usage, trade-off awareness.
  * Should demonstrate ability to solve moderate problems independently.
  * Depth should include "how" and "why", not just "what".
- Senior (5+ years):
  * Expect architectural thinking, trade-offs, scalability awareness.
  * Penalize superficial answers that lack depth.
  * Should demonstrate leadership-level technical decision making.
  * Should discuss edge cases, failure modes, and system implications.
  * A Senior giving only basic explanations should score low on depth.

Scoring Rules:
- Scores must range from 1 to 10.
- Do NOT inflate scores.
- 5 = acceptable baseline.
- 7 = strong.
- 9+ = exceptional and rare.
- If major technical error exists, technicalScore must be <= 4.
- If explanation is shallow for the experience level, depthScore must be <= 5.

Anti-Hallucination:
- If the answer lacks information, do NOT assume correctness.
- Evaluate strictly based only on the provided answer.
- Do not infer unstated knowledge.
- Score based only on provided content.

Do not be overly polite.
Be honest and constructive.

Return STRICT JSON only in this format:

{
  "technicalScore": number,
  "depthScore": number,
  "problemSolvingScore": number,
  "clarityScore": number,
  "communicationScore": number,
  "overallScore": number,
  "majorTechnicalErrors": string[],
  "strengths": string[],
  "weaknesses": string[],
  "improvements": string[],
  "summary": string,
  "idealAnswer": string (a structured, high-quality example of what a perfect answer for this level would be)
}`;
}
