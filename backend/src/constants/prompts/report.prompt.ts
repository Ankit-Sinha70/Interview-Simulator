import { AggregatedScores, ExperienceLevel, HireBand, ConfidenceLevel } from '../../models/interviewSession.model';

export interface ReportContext {
  questionsAndEvaluations: string;
  role: string;
  level: ExperienceLevel;
  aggregatedScores: AggregatedScores;
  hireBand: HireBand;
  confidenceLevel: ConfidenceLevel;
  weaknessFrequency: Record<string, number>;
}

export function getReportPrompt(ctx: ReportContext): string {
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

Interview Transcript & Evaluations:
${ctx.questionsAndEvaluations}

Tasks:

1. Generate a professional Executive Summary (2-3 sentences) that justifies the calculated hire band.
2. Identify top 3 key strengths.
3. Identify top 3 areas for improvement.
4. Generate a personalized 5-step improvement roadmap based on the specific weaknesses found.

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
  "executiveSummary": string
}`;
}
