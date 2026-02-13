import { VoiceMetadata } from '../../models/interviewSession.model';

export interface VoiceEvaluationContext {
    transcript: string;
    metadata: VoiceMetadata;
}

export function getVoiceEvaluationPrompt(ctx: VoiceEvaluationContext): string {
    return `You are evaluating a candidate’s spoken interview answer.

Transcript:
${ctx.transcript}

Voice Metadata:
- Duration (seconds): ${ctx.metadata.durationSeconds}
- Filler Word Count: ${ctx.metadata.fillerWordCount}
- Pause Count: ${ctx.metadata.pauseCount}
- Words Per Minute: ${ctx.metadata.wordsPerMinute}

Evaluate:
1. Verbal confidence
2. Fluency and hesitation
3. Clarity of speech structure
4. Professional tone
5. Overall spoken delivery quality

Rules:
- Penalize excessive filler words.
- Penalize frequent long pauses.
- Reward structured spoken explanations.
- Do not judge accent.
- Focus only on clarity and confidence.

Return STRICT JSON:

{
  "confidenceScore": number,
  "fluencyScore": number,
  "structureScore": number,
  "professionalismScore": number,
  "spokenDeliveryOverall": number,
  "feedback": string[]
}`;
}
