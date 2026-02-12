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

- Estimate confidence level based on score consistency (variance):
  - "High" if scores are consistent (variance < 1.0) and average >= 7
  - "Medium" if average 5-7 or scores are inconsistent (variance 1.0-2.5)
  - "Low" if average < 5 or scores are very inconsistent (variance > 2.5)

- Provide a hire recommendation:
  - "Yes" if average >= 7 and no critical weaknesses
  - "Maybe" if average 5-7 or mixed performance
  - "No" if average < 5 or fundamental gaps

- Provide a hireBand (more granular):
  - "Strong Hire" if average >= 8.5 and consistently high
  - "Hire" if average 7-8.4
  - "Borderline" if average 6-6.9
  - "No Hire" if average < 6

- Provide 3-5 specific areas the candidate should study next as nextPreparationFocus.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "averageScore": number,
  "strongestAreas": string[],
  "weakestAreas": string[],
  "confidenceLevel": "High" | "Medium" | "Low",
  "hireRecommendation": "Yes" | "Maybe" | "No",
  "hireBand": "Strong Hire" | "Hire" | "Borderline" | "No Hire",
  "improvementRoadmap": string[],
  "nextPreparationFocus": string[]
}`;
}
