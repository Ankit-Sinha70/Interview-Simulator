import { Difficulty, ExperienceLevel, GeneratedQuestion, FollowUpQuestion } from '../models/interviewSession.model';
import { isDifficultyAllowed, clampDifficulty, getLevelConfig } from '../constants/difficultyMatrix';

// ─── Validation Result ───

export interface ValidationResult {
    valid: boolean;
    reason?: string;
    correctedDifficulty?: Difficulty;
    correctedLevelScore?: number;
}

/**
 * Validate a generated question's difficulty against the session's experience level.
 * Returns valid: true if the question meets constraints, or valid: false with a reason.
 */
export function validateQuestionDifficulty(
    question: { difficulty: Difficulty; levelScore?: number; topic?: string },
    level: ExperienceLevel,
): ValidationResult {
    const config = getLevelConfig(level);

    // Check 1: Is the difficulty in the allowed set?
    if (!isDifficultyAllowed(question.difficulty, level)) {
        return {
            valid: false,
            reason: `Difficulty "${question.difficulty}" not allowed for ${level} level. Allowed: ${config.allowedDifficulty.join(', ')}`,
            correctedDifficulty: clampDifficulty(question.difficulty, level),
        };
    }

    // Check 2: Is the levelScore within the band?
    if (question.levelScore !== undefined) {
        const band = config.difficultyBand;
        if (question.levelScore < band.min || question.levelScore > band.max) {
            return {
                valid: false,
                reason: `Level score ${question.levelScore} outside band [${band.min}-${band.max}] for ${level} level`,
                correctedLevelScore: Math.max(band.min, Math.min(band.max, question.levelScore)),
            };
        }
    }

    return { valid: true };
}

/**
 * Correct a question's difficulty to fit within the allowed band.
 * Used as a guardrail when AI returns out-of-band values.
 */
export function correctQuestionDifficulty<T extends { difficulty: Difficulty; levelScore: number }>(
    question: T,
    level: ExperienceLevel,
): T {
    const config = getLevelConfig(level);
    const band = config.difficultyBand;

    // Clamp difficulty
    const correctedDifficulty = clampDifficulty(question.difficulty, level);

    // Clamp levelScore
    const correctedLevelScore = Math.max(band.min, Math.min(band.max, question.levelScore || band.min));

    return {
        ...question,
        difficulty: correctedDifficulty,
        levelScore: correctedLevelScore,
    };
}
