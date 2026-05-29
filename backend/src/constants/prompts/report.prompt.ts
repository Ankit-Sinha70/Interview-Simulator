import { AggregatedScores, ExperienceLevel, HireBand, ConfidenceLevel } from '../../models/interviewSession.model';

export interface ReportContext {
  questionsAndEvaluations: string;
  role: string;
  level: ExperienceLevel;
  aggregatedScores: AggregatedScores;
  hireBand: HireBand;
  confidenceLevel: ConfidenceLevel;
  weaknessFrequency: Record<string, number>;
  parsedResume?: any;
}

export function getReportPrompt(ctx: ReportContext): string {
  const hasResume = !!ctx.parsedResume;
  return `You are a senior technical interviewer generating a final structured interview report.

Context:
Role: ${ctx.role}
Level: ${ctx.level}
Calculated Hire Band: ${ctx.hireBand} (Based on average score)
Confidence Level: ${ctx.confidenceLevel} (Based on score variance)

Aggregated Scores:
Technical: ${ctx.aggregatedScores.averageTechnical}
Depth: ${ctx.aggregatedScores.averageDepth}
Problem Solving: ${ctx.aggregatedScores.averageProblemSolving}
Clarity: ${ctx.aggregatedScores.averageClarity}
Communication: ${ctx.aggregatedScores.averageCommunication}
Overall Average: ${ctx.aggregatedScores.overallAverage}

Recurrent Weaknesses:
${Object.entries(ctx.weaknessFrequency).map(([k, v]) => `- ${k}: ${v} times`).join('\n')}

${hasResume ? `CANDIDATE'S RESUME CONTEXT (Use this to perform resume alignment score and validation matrix):
${JSON.stringify(ctx.parsedResume, null, 2)}
` : ''}

Interview Transcript & Evaluations:
${ctx.questionsAndEvaluations}

Tasks:

1. Generate a professional Executive Summary (2-3 sentences) that justifies the calculated hire band.
2. Identify top 3 key strengths.
3. Identify top 3 areas for improvement.
4. Generate a personalized 5-step improvement roadmap based on the specific weaknesses found.
5. Generate an "interviewReadinessScore" (0-100) based on their performance, communication, and technical depth.
6. Generate a "recommendedLearningPath" (array of strings, e.g. "Master Advanced Node.js Event Loop", "Practice System Design for Distributed Caching") based on the technical gaps identified.
${hasResume ? `7. Calculate a "resumeAlignmentScore" (0-100) comparing how the candidate's actual interview performance matches their resume claims.
8. Identify "strongResumeSkills" (array of skills where they scored high) and "improvementResumeSkills" (array of skills where they claimed experience but scored low).
9. Create a "skillValidationMatrix" containing validation details for each primary skill in their resume. Format: Array of {"skill": string, "performanceScore": number (1-10), "insight": string (explaining the rating based on the interview)}.
10. Calculate a "projectUnderstandingScore" (0-100) reflecting how well they explained and defended the projects mentioned on their resume.` : ''}

Rules:
- Be objective and constructive.
- Do not inflate praise.
- Align tone with the seniority level.
- RECOMMENDATION MUST MATCH THE CALCULATED BAND (${ctx.hireBand}).

Return STRICT JSON:

{
  "averageScore": ${ctx.aggregatedScores.overallAverage},
  "strongestAreas": string[],
  "weakestAreas": string[],
  "hireRecommendation": "${ctx.hireBand === 'Strong Hire' || ctx.hireBand === 'Hire' ? 'Yes' : ctx.hireBand === 'Borderline' ? 'Maybe' : 'No'}",
  "confidenceLevel": "${ctx.confidenceLevel}",
  "improvementRoadmap": string[],
  "executiveSummary": string,
  "interviewReadinessScore": number,
  "recommendedLearningPath": string[]${hasResume ? `,
  "resumeAlignmentScore": number,
  "strongResumeSkills": string[],
  "improvementResumeSkills": string[],
  "skillValidationMatrix": [
    {
      "skill": "string",
      "performanceScore": number,
      "insight": "string"
    }
  ],
  "projectUnderstandingScore": number` : ''}
}`;
}
