import { callAI } from './provider.factory';
import { getVoiceEvaluationPrompt, VoiceEvaluationContext } from '../constants/prompts/voice.prompt';
import { VoiceEvaluation } from '../models/interviewSession.model';

/**
 * Evaluate voice confidence and delivery
 */
export async function evaluateVoice(context: VoiceEvaluationContext): Promise<VoiceEvaluation> {
    const prompt = getVoiceEvaluationPrompt(context);

    try {
        const result = await callAI<VoiceEvaluation>(prompt);

        const requiredFields: (keyof VoiceEvaluation)[] = [
            'confidenceScore', 'fluencyScore', 'structureScore',
            'professionalismScore', 'spokenDeliveryOverall', 'feedback'
        ];

        for (const field of requiredFields) {
            if (result[field] === undefined) {
                throw new Error(`Voice evaluation missing field: ${field}`);
            }
        }

        return result;
    } catch (error) {
        console.error('Voice evaluation failed:', error);
        throw error;
    }
}
