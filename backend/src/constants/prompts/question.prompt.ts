export function getQuestionPrompt(params: {
    role: string;
    level: string;
    previousQuestion?: string;
    evaluationSummary?: string;
}): string {
    return `You are a senior technical interviewer.

Generate one interview question based on:

Role: ${params.role}
Experience Level: ${params.level}
Previous Question: ${params.previousQuestion || 'None (this is the first question)'}
Previous Answer Evaluation: ${params.evaluationSummary || 'None (this is the first question)'}

Rules:
- If this is the first question, generate a foundational but relevant question.
- If this is a follow-up, focus on weak areas or incomplete explanations.
- Keep question realistic and professional.
- Avoid generic or overly simple questions.
- Make it appropriate for the experience level.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "question": string,
  "difficulty": "easy" | "medium" | "hard",
  "topic": string
}`;
}
