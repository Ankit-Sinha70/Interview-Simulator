export function getFollowUpPrompt(params: {
    weaknesses: string[];
    topic: string;
    summary: string;
}): string {
    return `Generate a follow-up interview question based on:

Weaknesses identified: ${params.weaknesses.join(', ')}
Previous Topic: ${params.topic}
Previous Answer Summary: ${params.summary}

Rules:
- Target the weakest area from the identified weaknesses.
- Increase difficulty slightly compared to the previous question.
- Avoid repeating the same question — ask from a different angle.
- Make it feel like a real interviewer probing deeper.
- Keep it professional and realistic.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "question": string,
  "focusArea": string
}`;
}
