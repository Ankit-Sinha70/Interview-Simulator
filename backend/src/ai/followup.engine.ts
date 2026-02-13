import { callAI } from './provider.factory';
import { getFollowUpPrompt, FollowUpContext } from '../constants/prompts/followup.prompt';
import { FollowUpQuestion } from '../models/interviewSession.model';

/**
 * Generate an adaptive follow-up question based on full session context
 */
export async function generateFollowUp(context: FollowUpContext): Promise<FollowUpQuestion> {
    const prompt = getFollowUpPrompt(context);

    try {
        const result = await callAI<any>(prompt);

        // Validation & Defaulting
        if (!result.question) {
            throw new Error('AI returned empty question');
        }

        return {
            question: result.question,
            topic: result.topic || context.previousTopic,
            difficulty: result.difficulty || context.targetDifficulty,
            intent: result.intent || context.followUpIntent,
            focusArea: result.topic || context.previousTopic, // Backward compat
        };
    } catch (error) {
        console.error('Follow-up generation failed:', error);
        // Fallback if AI fails completely (optional, or rethrow)
        throw error;
    }
}
