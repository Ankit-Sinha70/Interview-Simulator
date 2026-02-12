import { callAI } from './provider.factory';
import { getQuestionPrompt } from '../constants/prompts/question.prompt';
import { GeneratedQuestion } from '../models/interviewSession.model';

/**
 * Generate an interview question using AI
 */
export async function generateQuestion(params: {
    role: string;
    level: string;
    previousQuestion?: string;
    evaluationSummary?: string;
}): Promise<GeneratedQuestion> {
    const prompt = getQuestionPrompt(params);
    const result = await callAI<GeneratedQuestion>(prompt);

    // Validate the response structure
    if (!result.question || !result.difficulty || !result.topic) {
        throw new Error('AI returned incomplete question data');
    }

    return result;
}
