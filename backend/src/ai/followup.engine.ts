import { callAI } from './provider.factory';
import { getFollowUpPrompt } from '../constants/prompts/followup.prompt';
import { FollowUpQuestion, WeaknessTracker } from '../models/interviewSession.model';

/**
 * Generate an adaptive follow-up question based on weaknesses and intelligence
 */
export async function generateFollowUp(params: {
    weaknesses: string[];
    topic: string;
    summary: string;
    weaknessFrequency?: WeaknessTracker;
    topicMastered?: boolean;
    priority?: string;
}): Promise<FollowUpQuestion> {
    const prompt = getFollowUpPrompt(params as any);
    const result = await callAI<FollowUpQuestion>(prompt);

    if (!result.question || !result.focusArea) {
        throw new Error('AI returned incomplete follow-up data');
    }

    return result;
}
