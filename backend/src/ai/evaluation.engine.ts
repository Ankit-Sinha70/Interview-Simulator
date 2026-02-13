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

    return result;
}
