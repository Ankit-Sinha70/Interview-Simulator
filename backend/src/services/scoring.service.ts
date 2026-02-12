import { Evaluation, ExperienceLevel, AggregatedScores } from '../models/interviewSession.model';
import {
    calculateOverallScore,
    calculateAggregatedScores,
    getWeightMap,
} from '../utils/scoreCalculator';

/**
 * Process an evaluation with role-aware weighted scoring
 */
export function processEvaluation(
    rawEvaluation: Evaluation,
    level: ExperienceLevel,
): Evaluation {
    const weightedOverall = calculateOverallScore(rawEvaluation, level);

    return {
        ...rawEvaluation,
        overallScore: weightedOverall,
    };
}

/**
 * Get aggregated scoring summary across all evaluations
 */
export function getScoringSummary(evaluations: Evaluation[]): AggregatedScores {
    return calculateAggregatedScores(evaluations);
}
