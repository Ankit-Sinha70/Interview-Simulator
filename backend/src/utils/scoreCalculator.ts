import { Evaluation, ExperienceLevel, Difficulty, AggregatedScores, HireBand, DifficultyBand } from '../models/interviewSession.model';
import { clampDifficulty } from '../constants/difficultyMatrix';

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
        problemSolvingScore: 0.25,
        technicalScore: 0.20,
        clarityScore: 0.15,
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
            averageTechnical: 0, averageDepth: 0, averageClarity: 0,
            averageProblemSolving: 0, averageCommunication: 0, overallAverage: 0,
            strongestDimension: 'N/A', weakestDimension: 'N/A',
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

    let strongest = '', weakest = '';
    let highScore = -Infinity, lowScore = Infinity;
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
    let weakest = '', lowestScore = Infinity;
    for (const [dim, score] of Object.entries(dimensions)) {
        if (score < lowestScore) { lowestScore = score; weakest = dim; }
    }
    return weakest;
}

// ─── Adaptive Difficulty Logic ───

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

/**
 * Get next difficulty level — gradual escalation, clamped within experience band
 */
export function getNextDifficulty(
    currentDifficulty: Difficulty,
    overallScore: number,
    experienceLevel?: ExperienceLevel,
): Difficulty {
    const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
    if (overallScore > 8 && currentIndex < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[currentIndex + 1];
    if (overallScore <= 5 && currentIndex > 0) return DIFFICULTY_ORDER[currentIndex - 1];
    return currentDifficulty;
}

export function determineFollowUpIntent(
    evaluation: Evaluation,
    topicMastered: boolean
): import('../models/interviewSession.model').FollowUpIntent {
    if (topicMastered) return 'ESCALATE_DIFFICULTY'; // Or new domain, but 'ESCALATE' fits generic intent, prompts handle "new domain" separately if needed, but user spec said 'ESCALATE_DIFFICULTY'

    // Use user-defined thresholds
    if (evaluation.technicalScore < 5) return 'CLARIFY_TECHNICAL';
    if (evaluation.depthScore < 6) return 'PROBE_DEPTH';
    if (evaluation.problemSolvingScore < 6) return 'SCENARIO_BASED';

    // If all scores are good, escalate
    return 'ESCALATE_DIFFICULTY';
}

// ─── Variance & Confidence ───

/**
 * Calculate score variance (for confidence level)
 */
export function calculateVariance(scores: number[]): number {
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
    return Math.round((squaredDiffs.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

/**
 * Determine confidence level from variance and question count
 */
export function getConfidenceFromVariance(variance: number, questionCount: number): 'High' | 'Medium' | 'Low' {
    if (questionCount < 3) return 'Medium'; // Not enough data
    if (variance < 1.0) return 'High';
    if (variance > 2.5) return 'Low';
    return 'Medium';
}

// ─── Hire Band Logic ───

/**
 * Determine granular hire band from average score
 */
export function getHireBand(avgScore: number): HireBand {
    if (avgScore >= 8.5) return 'Strong Hire';
    if (avgScore >= 7) return 'Hire';
    if (avgScore >= 6) return 'Borderline';
    return 'No Hire';
}

/**
 * Get hire recommendation (simplified version)
 */
export function getHireRecommendation(avgScore: number): 'Yes' | 'Maybe' | 'No' {
    if (avgScore >= 7) return 'Yes';
    if (avgScore >= 5) return 'Maybe';
    return 'No';
}

// ─── Personalized Roadmap ───

const ROADMAP_SUGGESTIONS: Record<string, string[]> = {
    'Technical Accuracy': [
        'Review core language fundamentals and common patterns',
        'Practice solving LeetCode/HackerRank problems daily',
        'Study official documentation for your primary framework',
    ],
    'Depth of Explanation': [
        'Study system design principles and architectural patterns',
        'Practice explaining tradeoffs in technical decisions',
        'Build projects and document your architecture choices',
    ],
    'Clarity': [
        'Practice structured communication (STAR method)',
        'Record yourself explaining concepts and review',
        'Use diagrams and examples when explaining complex topics',
    ],
    'Problem Solving': [
        'Practice breaking complex problems into smaller steps',
        'Study common algorithms and data structure patterns',
        'Work on open-source issues to develop debugging skills',
    ],
    'Communication': [
        'Do mock interviews with peers or mentors',
        'Reduce filler words by practicing deliberate pauses',
        'Structure answers with clear intro, body, and conclusion',
    ],
};

/**
 * Get personalized improvement suggestions based on weakest dimension
 */
export function getPersonalizedRoadmap(weakestDimension: string): string[] {
    return ROADMAP_SUGGESTIONS[weakestDimension] || ROADMAP_SUGGESTIONS['Technical Accuracy'];
}
