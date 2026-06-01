import { Role, ExperienceLevel, Difficulty, FollowUpIntent } from '../../models/interviewSession.model';
import { getAllowedTopics, getForbiddenTopics, getLevelConfig } from '../difficultyMatrix';

export interface FollowUpContext {
   role: Role | string;
   experienceLevel: ExperienceLevel;
   interviewStyle?: string;
   companyStyle?: string;
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
   parsedResume?: any;
   githubProfile?: any;
   jobDescription?: string;
   targetCompany?: string;
   questionType?: string;
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

   let questionInstructions = '';
   if (ctx.questionType) {
      if (ctx.questionType === 'resume') {
         questionInstructions = `\nFOCUS AREA INSTRUCTION: Focus heavily on the candidate's resume claims. Ask them to explain or discuss a specific project, technology choice, or experience listed in their parsed resume. Tailor the question specifically to their claimed background.`;
      } else if (ctx.questionType === 'github') {
         const topRepos = ctx.githubProfile?.topRepositories ? ctx.githubProfile.topRepositories.join(', ') : '';
         questionInstructions = `\nFOCUS AREA INSTRUCTION: Focus heavily on the candidate's GitHub repositories, active technical skills, or project evidence. Ask them about tech choices, optimization, or architecture of a project on their GitHub profile (like ${topRepos || 'their repositories'} if available) and how they structured their code.`;
      } else if (ctx.questionType === 'jd_required') {
         questionInstructions = `\nFOCUS AREA INSTRUCTION: Focus heavily on the key required skills listed in the target Job Description. Ask conceptual or implementation questions related to these skills.`;
      } else if (ctx.questionType === 'missing_skill') {
         questionInstructions = `\nFOCUS AREA INSTRUCTION: (Missing Skill Pressure Testing) Identify a technology or skill required or preferred by the Job Description that is NOT mentioned in the candidate's resume. Ask a targeted technical question to validate if the candidate actually has any knowledge or capability in this missing skill.`;
      } else if (ctx.questionType === 'scenario') {
         questionInstructions = `\nFOCUS AREA INSTRUCTION: Ask a realistic, scenario-based system design or technical debugging question (e.g. application performance degrades under heavy traffic, database connection pool exhaustion, memory leak investigation, scaling issues).`;
      } else if (ctx.questionType === 'behavioral') {
         questionInstructions = `\nFOCUS AREA INSTRUCTION: Ask a behavioral question testing soft skills, leadership, or teamwork dynamics (e.g. handling a team conflict, resolving technical disagreements, dealing with a challenging timeline).`;
      }
   }

   return `You are a senior technical interviewer conducting a realistic interview.
${questionInstructions}
Interview Style: ${ctx.interviewStyle || 'friendly'}
Company Style: ${ctx.companyStyle || 'general'} ${ctx.targetCompany ? `(Specifically targeted at company: ${ctx.targetCompany})` : ''}
${ctx.targetCompany ? `Ensure questions test skills, coding paradigms, and topics typical of an engineering interview at ${ctx.targetCompany}.` : ''}
If the Company Style is "google", ask deeply technical, algorithmic, or scale-focused questions.
If the Company Style is "startup", ask practical, fast-paced, "get it done" questions.
If the Interview Style is "strict" or "faang", be very demanding and precise.
If the Interview Style is "friendly", use a supportive tone.

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

${ctx.jobDescription ? `TARGET JOB DESCRIPTION CONTEXT:
${ctx.jobDescription}

Please align the follow-up question to test the specific technologies and requirements described in this Job Description.
` : ''}

${ctx.parsedResume ? `CANDIDATE'S RESUME CONTEXT (Use this to strongly tailor your follow-up if applicable to their answers):
${JSON.stringify(ctx.parsedResume, null, 2)}

CRITICAL INSTRUCTION FOR RESUME: 
If the follow-up asks about something from their resume (like a specific project or role), set "source" to "resume", and "relatedContext" to the project/company name.
Otherwise, set "source" to "general" and "relatedContext" to null.
` : ''}

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
  "intent": "${ctx.followUpIntent}",
  "source": "general" | "resume",
  "relatedContext": string | null,
  "whyAsked": string (a short explanation of why this specific follow-up was asked based on the previous answer)
}`;
}
