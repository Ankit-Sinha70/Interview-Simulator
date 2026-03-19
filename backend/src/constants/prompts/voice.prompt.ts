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
6. Tone variation (e.g., "Monotone", "Dynamic", "Engaging")
7. Detected issues (short actionable phrases like "Too many fillers", "Frequent pauses")

Rules:
- Penalize excessive filler words.
- Penalize frequent long pauses.
- Reward structured spoken explanations.
- Do not judge accent.
- Focus only on clarity and confidence.

Return STRICT JSON:

{
  "confidenceScore": number,  // 1-100 scale
  "fluencyScore": number,     // 1-100 scale 
  "structureScore": number,   // 1-100 scale
  "professionalismScore": number, // 1-100 scale
  "spokenDeliveryOverall": number, // 1-10 scale
  "toneVariation": string,
  "detectedIssues": string[],
  "feedback": string[]
}`;
}
