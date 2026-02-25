import { callAI } from './provider.factory';
import { getQuestionPrompt } from '../constants/prompts/question.prompt';
import { GeneratedQuestion, ExperienceLevel } from '../models/interviewSession.model';
import { validateQuestionDifficulty, correctQuestionDifficulty } from '../services/difficultyValidator';
import { getLevelConfig } from '../constants/difficultyMatrix';

const MAX_RETRIES = 3;

/**
 * Generate an interview question using AI with difficulty validation and retry logic
 */
export async function generateQuestion(params: {
    role: string;
    level: string;
    previousQuestion?: string;
    evaluationSummary?: string;
}): Promise<GeneratedQuestion> {
    const experienceLevel = params.level as ExperienceLevel;
    const config = getLevelConfig(experienceLevel);
    const band = config.difficultyBand;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const prompt = getQuestionPrompt(params);
        const result = await callAI<GeneratedQuestion>(prompt);

        // Validate the response structure
        if (!result.question || !result.difficulty || !result.topic) {
            throw new Error('AI returned incomplete question data');
        }

        // Default levelScore if missing
        if (!result.levelScore) {
            result.levelScore = band.min;
        }

        // Validate difficulty against level constraints
        const validation = validateQuestionDifficulty(result, experienceLevel);

        if (validation.valid) {
            console.log(`[QuestionEngine] Generated valid question (attempt ${attempt}): difficulty=${result.difficulty}, levelScore=${result.levelScore}, topic=${result.topic}`);
            return result;
        }

        console.warn(`[QuestionEngine] Difficulty validation failed (attempt ${attempt}/${MAX_RETRIES}): ${validation.reason}`);

        // On last attempt, correct and use anyway
        if (attempt === MAX_RETRIES) {
            console.warn(`[QuestionEngine] Max retries reached. Correcting difficulty and using question.`);
            const corrected = correctQuestionDifficulty(result, experienceLevel);
            console.log(`[QuestionEngine] Corrected: difficulty=${corrected.difficulty}, levelScore=${corrected.levelScore}`);
            return corrected;
        }
    }

    // Should never reach here, but satisfy TS
    throw new Error('Failed to generate valid question after max retries');
}
