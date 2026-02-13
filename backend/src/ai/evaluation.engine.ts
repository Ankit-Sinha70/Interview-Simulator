import { callAI } from './provider.factory';
import { getEvaluationPrompt } from '../constants/prompts/evaluation.prompt';
import { Evaluation, VoiceMetadata } from '../models/interviewSession.model';

/**
 * Evaluate a candidate's answer using AI
 */
export async function evaluateAnswer(params: {
    question: string;
    answer: string;
    role: string;
    level: string;
    voiceMeta?: VoiceMetadata;
}): Promise<Evaluation> {
    const prompt = getEvaluationPrompt(params);
    const result = await callAI<Evaluation>(prompt);

    // Validate required fields
    const requiredFields: (keyof Evaluation)[] = [
        'technicalScore', 'depthScore', 'clarityScore',
        'problemSolvingScore', 'communicationScore', 'overallScore',
        'strengths', 'weaknesses', 'improvements',
    ];

    for (const field of requiredFields) {
        if (result[field] === undefined || result[field] === null) {
            throw new Error(`AI evaluation missing field: ${field}`);
        }
    }

    // Ensure array fields are arrays
    const arrayFields: (keyof Evaluation)[] = ['strengths', 'weaknesses', 'improvements', 'majorTechnicalErrors'];
    for (const field of arrayFields) {
        // If field exists but isn't an array, force it to []
        if (result[field] !== undefined && !Array.isArray(result[field])) {
            (result as any)[field] = [];
        }
    }

    // Clamp scores to 1-10 range
    const scoreFields: (keyof Evaluation)[] = [
        'technicalScore', 'depthScore', 'clarityScore',
        'problemSolvingScore', 'communicationScore', 'overallScore',
    ];
    for (const field of scoreFields) {
        const val = result[field] as number;
        (result as any)[field] = Math.max(1, Math.min(10, Math.round(val * 100) / 100));
    }

    // ─── Layer 3: Backend Sanity Checks & Capping ───

    // Rule: If majorTechnicalErrors exist, technicalScore MUST be <= 4.
    if (result.majorTechnicalErrors && result.majorTechnicalErrors.length > 0) {
        if (result.technicalScore > 4) {
            console.log(`[Eval] Capping Technical Score (Was: ${result.technicalScore}, Cap: 4) due to Errors:`, result.majorTechnicalErrors);
            result.technicalScore = 4;
        }
    }

    // Rule: If weaknesses are empty but overall score < 6, force a check? 
    // For now, capping is the most critical anti-inflation rule.

    return result;
}
