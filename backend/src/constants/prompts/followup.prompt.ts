import { WeaknessTracker } from '../../models/interviewSession.model';

export type FollowUpPriority = 'incorrect_concept' | 'shallow_depth' | 'problem_solving_gap' | 'new_domain';

export function getFollowUpPrompt(params: {
  weaknesses: string[];
  topic: string;
  summary: string;
  weaknessFrequency?: WeaknessTracker;
  topicMastered?: boolean;
  priority?: FollowUpPriority;
}): string {
  const priorityInstruction = getPriorityInstruction(params.priority);
  const frequencyContext = params.weaknessFrequency
    ? `\nWeakness frequency this session: Technical=${params.weaknessFrequency.technicalWeakCount}, Depth=${params.weaknessFrequency.depthWeakCount}, Clarity=${params.weaknessFrequency.clarityWeakCount}, ProblemSolving=${params.weaknessFrequency.problemSolvingWeakCount}, Communication=${params.weaknessFrequency.communicationWeakCount}`
    : '';
  const topicContext = params.topicMastered
    ? '\nIMPORTANT: The candidate has mastered this topic (scored >8 twice). Move to a DIFFERENT topic/domain entirely.'
    : '';

  return `Generate a follow-up interview question based on:

Weaknesses identified: ${params.weaknesses.join(', ')}
Previous Topic: ${params.topic}
Previous Answer Summary: ${params.summary}${frequencyContext}${topicContext}

Follow-up Strategy: ${priorityInstruction}

Rules:
- Target the weakest area from the identified weaknesses.
- If a weakness has been repeated multiple times (high frequency), escalate the focus.
- Adjust difficulty based on the candidate's performance.
- Avoid repeating the same question — ask from a different angle.
- Make it feel like a real interviewer probing deeper.
- Keep it professional and realistic.

Return STRICT JSON only, no markdown formatting, no code blocks:
{
  "question": string,
  "focusArea": string
}`;
}

function getPriorityInstruction(priority?: FollowUpPriority): string {
  switch (priority) {
    case 'incorrect_concept':
      return 'The candidate showed incorrect understanding. Ask a clarifying question to verify their foundational knowledge before moving on.';
    case 'shallow_depth':
      return 'The candidate gave a shallow answer. Probe deeper by asking about implementation details, tradeoffs, or edge cases.';
    case 'problem_solving_gap':
      return 'The candidate struggled with problem-solving. Present a scenario or design challenge related to their weakest area.';
    case 'new_domain':
      return 'The candidate has mastered this topic. Switch to a completely different technical domain to test breadth.';
    default:
      return 'Generate an appropriate follow-up targeting the weakest identified area.';
  }
}
