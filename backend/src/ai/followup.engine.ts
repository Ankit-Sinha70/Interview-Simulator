import { callAI } from './provider.factory';
import { getFollowUpPrompt, FollowUpContext } from '../constants/prompts/followup.prompt';
import { FollowUpQuestion, ExperienceLevel } from '../models/interviewSession.model';
import { validateQuestionDifficulty, correctQuestionDifficulty } from '../services/difficultyValidator';
import { getLevelConfig } from '../constants/difficultyMatrix';

const MAX_RETRIES = 3;

/**
 * Generate an adaptive follow-up question with difficulty validation and retry logic
 */
export async function generateFollowUp(context: FollowUpContext): Promise<FollowUpQuestion> {
    const experienceLevel = context.experienceLevel;
    const config = getLevelConfig(experienceLevel);
    const band = config.difficultyBand;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const prompt = getFollowUpPrompt(context);

        try {
            const result = await callAI<any>(prompt);

            // Validation & Defaulting
            if (!result.question) {
                throw new Error('AI returned empty question');
            }

            const followUp: FollowUpQuestion = {
                question: result.question,
                topic: result.topic || context.previousTopic,
                difficulty: result.difficulty || context.targetDifficulty,
                levelScore: result.levelScore || band.min,
                intent: result.intent || context.followUpIntent,
                focusArea: result.topic || context.previousTopic, // Backward compat
            };

            // Validate difficulty against level constraints
            const validation = validateQuestionDifficulty(followUp, experienceLevel);

            if (validation.valid) {
                console.log(`[FollowUpEngine] Generated valid follow-up (attempt ${attempt}): difficulty=${followUp.difficulty}, levelScore=${followUp.levelScore}, topic=${followUp.topic}, intent=${followUp.intent}`);
                return followUp;
            }

            console.warn(`[FollowUpEngine] Difficulty validation failed (attempt ${attempt}/${MAX_RETRIES}): ${validation.reason}`);

            // On last attempt, correct and use
            if (attempt === MAX_RETRIES) {
                console.warn(`[FollowUpEngine] Max retries reached. Correcting difficulty.`);
                const corrected = correctQuestionDifficulty(followUp, experienceLevel);
                console.log(`[FollowUpEngine] Corrected: difficulty=${corrected.difficulty}, levelScore=${corrected.levelScore}`);
                return corrected;
            }
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                console.error('Follow-up generation failed after max retries:', error);
                throw error;
            }
            console.warn(`[FollowUpEngine] Attempt ${attempt} failed, retrying...`);
        }
    }

    // Should never reach here
    throw new Error('Failed to generate valid follow-up question');
}
