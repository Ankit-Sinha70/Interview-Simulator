import { callAI } from './provider.factory';
import { getFollowUpPrompt } from '../constants/prompts/followup.prompt';
import { FollowUpQuestion } from '../models/interviewSession.model';

/**
 * Generate an adaptive follow-up question based on weaknesses
 */
export async function generateFollowUp(params: {
    weaknesses: string[];
    topic: string;
    summary: string;
}): Promise<FollowUpQuestion> {
    const prompt = getFollowUpPrompt(params);
    const result = await callAI<FollowUpQuestion>(prompt);

    if (!result.question || !result.focusArea) {
        throw new Error('AI returned incomplete follow-up data');
    }

    return result;
}
