import { Evaluation, ExperienceLevel, Difficulty, AggregatedScores } from '../models/interviewSession.model';

// ─── Role-Aware Weight Maps ───

interface WeightMap {
    technicalScore: number;
    depthScore: number;
    clarityScore: number;
    problemSolvingScore: number;
    communicationScore: number;
}

const WEIGHT_MAPS: Record<ExperienceLevel, WeightMap> = {
    Junior: {
        technicalScore: 0.30,
        clarityScore: 0.25,
        problemSolvingScore: 0.20,
        depthScore: 0.15,
        communicationScore: 0.10,
    },
    Mid: {
        technicalScore: 0.25,
        depthScore: 0.25,
        problemSolvingScore: 0.25,
        clarityScore: 0.15,
        communicationScore: 0.10,
    },
    Senior: {
        depthScore: 0.30,
        technicalScore: 0.25,
        problemSolvingScore: 0.25,
        clarityScore: 0.10,
        communicationScore: 0.10,
    },
};

/**
 * Get the weight map for a given experience level
 */
export function getWeightMap(level: ExperienceLevel): WeightMap {
    return WEIGHT_MAPS[level];
}

/**
 * Calculate weighted overall score using role-aware weights
 */
export function calculateOverallScore(
    evaluation: Omit<Evaluation, 'overallScore' | 'strengths' | 'weaknesses' | 'improvements'>,
    level: ExperienceLevel,
): number {
    const weights = WEIGHT_MAPS[level];

    const weighted =
        evaluation.technicalScore * weights.technicalScore +
        evaluation.depthScore * weights.depthScore +
        evaluation.clarityScore * weights.clarityScore +
        evaluation.problemSolvingScore * weights.problemSolvingScore +
        evaluation.communicationScore * weights.communicationScore;

    return Math.round(weighted * 100) / 100;
}

/**
 * Calculate aggregated scores across all evaluations
 */
export function calculateAggregatedScores(evaluations: Evaluation[]): AggregatedScores {
    if (evaluations.length === 0) {
        return {
            averageTechnical: 0,
            averageDepth: 0,
            averageClarity: 0,
            averageProblemSolving: 0,
            averageCommunication: 0,
            overallAverage: 0,
            strongestDimension: 'N/A',
            weakestDimension: 'N/A',
        };
    }

    const n = evaluations.length;
    const sum = evaluations.reduce(
        (acc, e) => ({
            technical: acc.technical + e.technicalScore,
            depth: acc.depth + e.depthScore,
            clarity: acc.clarity + e.clarityScore,
            problemSolving: acc.problemSolving + e.problemSolvingScore,
            communication: acc.communication + e.communicationScore,
            overall: acc.overall + e.overallScore,
        }),
        { technical: 0, depth: 0, clarity: 0, problemSolving: 0, communication: 0, overall: 0 },
    );

    const averages: Record<string, number> = {
        'Technical Accuracy': Math.round((sum.technical / n) * 100) / 100,
        'Depth of Explanation': Math.round((sum.depth / n) * 100) / 100,
        'Clarity': Math.round((sum.clarity / n) * 100) / 100,
        'Problem Solving': Math.round((sum.problemSolving / n) * 100) / 100,
        'Communication': Math.round((sum.communication / n) * 100) / 100,
    };

    // Find strongest and weakest
    let strongest = '';
    let weakest = '';
    let highScore = -Infinity;
    let lowScore = Infinity;

    for (const [dim, avg] of Object.entries(averages)) {
        if (avg > highScore) { highScore = avg; strongest = dim; }
        if (avg < lowScore) { lowScore = avg; weakest = dim; }
    }

    return {
        averageTechnical: averages['Technical Accuracy'],
        averageDepth: averages['Depth of Explanation'],
        averageClarity: averages['Clarity'],
        averageProblemSolving: averages['Problem Solving'],
        averageCommunication: averages['Communication'],
        overallAverage: Math.round((sum.overall / n) * 100) / 100,
        strongestDimension: strongest,
        weakestDimension: weakest,
    };
}

/**
 * Find the weakest scoring dimension from a single evaluation
 */
export function findWeakestDimension(evaluation: Evaluation): string {
    const dimensions: Record<string, number> = {
        'Technical Accuracy': evaluation.technicalScore,
        'Depth of Explanation': evaluation.depthScore,
        'Clarity': evaluation.clarityScore,
        'Problem Solving': evaluation.problemSolvingScore,
        'Communication': evaluation.communicationScore,
    };

    let weakest = '';
    let lowestScore = Infinity;

    for (const [dim, score] of Object.entries(dimensions)) {
        if (score < lowestScore) {
            lowestScore = score;
            weakest = dim;
        }
    }

    return weakest;
}

// ─── Adaptive Difficulty Logic ───

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

/**
 * Get next difficulty level — gradual escalation, no jumps
 */
export function getNextDifficulty(currentDifficulty: Difficulty, overallScore: number): Difficulty {
    const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);

    // Score > 8 → escalate one step
    if (overallScore > 8 && currentIndex < DIFFICULTY_ORDER.length - 1) {
        return DIFFICULTY_ORDER[currentIndex + 1];
    }

    // Score < 4 → de-escalate one step
    if (overallScore < 4 && currentIndex > 0) {
        return DIFFICULTY_ORDER[currentIndex - 1];
    }

    // Otherwise maintain current difficulty
    return currentDifficulty;
}

/**
 * Rule: Should the next question probe deeper on the weak dimension?
 */
export function shouldProbeDeeper(evaluation: Evaluation): boolean {
    const weakestScore = Math.min(
        evaluation.technicalScore,
        evaluation.depthScore,
        evaluation.clarityScore,
        evaluation.problemSolvingScore,
        evaluation.communicationScore,
    );
    // If weakest dimension is depth and it's below 6, probe deeper
    return evaluation.depthScore === weakestScore && evaluation.depthScore < 6;
}

/**
 * Rule: Should the system ask a clarifying follow-up before moving to a new topic?
 * Triggered when technical score is very low (< 5)
 */
export function shouldAskClarifying(evaluation: Evaluation): boolean {
    return evaluation.technicalScore < 5;
}

/**
 * Determine if difficulty should increase based on recent scores (legacy compat)
 */
export function shouldIncreaseDifficulty(recentScores: number[]): boolean {
    if (recentScores.length < 2) return false;
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    return avg >= 7;
}
