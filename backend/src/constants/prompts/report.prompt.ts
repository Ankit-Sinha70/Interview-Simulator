export function getReportPrompt(params: {
  questionsAndEvaluations: string;
  role: string;
  level: string;
}): string {
  return `Generate a structured final interview report.

Role: ${params.role}
Experience Level: ${params.level}

All questions, answers, and evaluation scores:
${params.questionsAndEvaluations}

Rules:
- Provide overall average score (1-10).
- Identify the 2-3 strongest skill categories.
- Identify the 2-3 weakest categories.
- Provide an actionable 5-step improvement roadmap with specific, practical advice.
- Estimate confidence level based on score consistency and performance trend:
  - "High" if average >= 7 and consistent
  - "Medium" if average 5-7 or inconsistent
  - "Low" if average < 5
- Provide a hire recommendation:
  - "Yes" if average >= 7 and no critical weaknesses
  - "Maybe" if average 5-7 or mixed performance
  - "No" if average < 5 or fundamental gaps
- Provide 3-5 specific areas the candidate should study next as nextPreparationFocus.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "averageScore": number,
  "strongestAreas": string[],
  "weakestAreas": string[],
  "confidenceLevel": "High" | "Medium" | "Low",
  "hireRecommendation": "Yes" | "Maybe" | "No",
  "improvementRoadmap": string[],
  "nextPreparationFocus": string[]
}`;
}
