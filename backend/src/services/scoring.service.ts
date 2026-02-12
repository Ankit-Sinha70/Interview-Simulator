import { Evaluation, ExperienceLevel, AggregatedScores } from '../models/interviewSession.model';
import {
    calculateOverallScore,
    calculateAggregatedScores,
    findWeakestDimension,
    shouldIncreaseDifficulty,
} from '../utils/scoreCalculator';

/**
 * Process evaluation scores — recalculate overall using role-aware weights
 */
export function processEvaluation(evaluation: Evaluation, level: ExperienceLevel): Evaluation {
    const calculatedOverall = calculateOverallScore(evaluation, level);
    return {
        ...evaluation,
        overallScore: calculatedOverall,
    };
}

/**
 * Get aggregated scoring summary from all evaluations
 */
export function getScoringSummary(evaluations: Evaluation[]): AggregatedScores & {
    shouldIncreaseDifficulty: boolean;
    totalQuestionsAnswered: number;
} {
    const aggregated = calculateAggregatedScores(evaluations);
    const recentOverallScores = evaluations.slice(-3).map((e) => e.overallScore);
    const increaseDifficulty = shouldIncreaseDifficulty(recentOverallScores);

    return {
        ...aggregated,
        shouldIncreaseDifficulty: increaseDifficulty,
        totalQuestionsAnswered: evaluations.length,
    };
}
