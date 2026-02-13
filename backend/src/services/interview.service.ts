import { v4 as uuidv4 } from 'uuid';
import {
    Role,
    ExperienceLevel,
    InterviewMode,
    Evaluation,
    QuestionEntry,
    AnswerInfo,
    GeneratedQuestion,
    FollowUpQuestion,
    VoiceMetadata,
    AggregatedScores,
    WeaknessTracker,
    VoiceEvaluation,
} from '../models/interviewSession.model';
import * as sessionService from './session.service';
import * as scoringService from './scoring.service';
import { generateQuestion } from '../ai/question.engine';
import { evaluateAnswer } from '../ai/evaluation.engine';
import { generateFollowUp } from '../ai/followup.engine';
import { evaluateVoice } from '../ai/voice.engine';

import {
    getNextDifficulty,
    determineFollowUpIntent,
    findWeakestDimension,
} from '../utils/scoreCalculator';

// ─── Weakness Dimension Map ───

const WEAKNESS_DIMENSION_MAP: Record<string, keyof WeaknessTracker> = {
    'Technical Accuracy': 'technicalWeakCount',
    'Depth of Explanation': 'depthWeakCount',
    'Clarity': 'clarityWeakCount',
    'Problem Solving': 'problemSolvingWeakCount',
    'Communication': 'communicationWeakCount',
};

import { User } from '../models/user.model';

// ...

/**
 * Start a new interview session
 */
export async function startInterview(
    userId: string,
    role: Role | string,
    experienceLevel: ExperienceLevel,
    mode: InterviewMode = 'text',
) {
    // Check usage limits
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Reset monthly usage if needed
    if (user.checkReset()) {
        await user.save();
    }

    if (user.planType === 'FREE' && user.interviewsUsedThisMonth >= 2) {
        throw new Error('Free plan limit reached. Upgrade to Pro for unlimited interviews.');
    }

    // Increment usage
    user.interviewsUsedThisMonth += 1;
    await user.save();

    const session = await sessionService.createSession(role, experienceLevel, mode);
    session.status = 'IN_PROGRESS';

    // Generate first question
    const firstQuestion: GeneratedQuestion = await generateQuestion({
        role: session.role,
        level: session.experienceLevel,
    });

    // Add question to session
    const questionEntry: QuestionEntry = {
        questionId: uuidv4(),
        questionText: firstQuestion.question,
        topic: firstQuestion.topic,
        difficulty: firstQuestion.difficulty,
        type: 'initial',
        answer: null,
        evaluation: null,
    };

    session.questions.push(questionEntry);
    session.totalQuestions = 1;
    session.currentQuestionIndex = 0;

    await sessionService.updateSession(session);

    return {
        sessionId: session.sessionId,
        question: firstQuestion,
    };
}

/**
 * Process an answer — evaluate, track weaknesses, determine adaptive follow-up
 */
export async function processAnswer(
    sessionId: string,
    answer: string,
    voiceMeta?: VoiceMetadata,
) {
    const session = await sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status !== 'IN_PROGRESS') throw new Error('Session is not in progress');

    // Find the current unanswered question
    const currentQuestionIndex = session.questions.findIndex((q) => q.answer === null);
    if (currentQuestionIndex === -1) throw new Error('No pending question found');

    const currentQuestion = session.questions[currentQuestionIndex];

    // Save the answer with voice metadata
    const answerInfo: AnswerInfo = {
        text: answer,
        answeredAt: new Date().toISOString(),
    };
    if (voiceMeta) {
        answerInfo.voiceMeta = voiceMeta;
        if (session.mode === 'text') session.mode = 'hybrid';
    }
    currentQuestion.answer = answerInfo;

    // Evaluate the answer using AI
    // 2. Evaluate answer (Text + Voice)
    const [rawEvaluation, voiceEval] = await Promise.all([
        evaluateAnswer({
            question: currentQuestion.questionText,
            answer,
            role: session.role,
            level: session.experienceLevel,
            voiceMeta,
        }),
        voiceMeta ? evaluateVoice({ transcript: answer, metadata: voiceMeta }) : Promise.resolve(undefined)
    ]);

    const evaluation = scoringService.processEvaluation(rawEvaluation, session.experienceLevel);

    // 3. Update session with answer and evaluation
    const updatedAnswerInfo: AnswerInfo = {
        text: answer,
        voiceMeta,
        voiceEvaluation: voiceEval,
        answeredAt: new Date().toISOString(),
    };
    currentQuestion.answer = updatedAnswerInfo;
    currentQuestion.evaluation = evaluation;

    // ─── Track Weakness Frequency ───
    const weakestDim = findWeakestDimension(evaluation);
    const trackerKey = WEAKNESS_DIMENSION_MAP[weakestDim];
    if (trackerKey && session.weaknessTracker) {
        session.weaknessTracker[trackerKey]++;
    }

    // ─── Track Topic Scores for Mastery Detection ───
    if (!session.topicScores) session.topicScores = {};
    const topic = currentQuestion.topic;
    if (!session.topicScores[topic]) session.topicScores[topic] = [];
    session.topicScores[topic].push(evaluation.overallScore);

    // ─── Aggregated Scores ───
    const completedEvaluations = session.questions
        .filter((q) => q.evaluation !== null)
        .map((q) => q.evaluation!);

    const scoringSummary = scoringService.getScoringSummary(completedEvaluations);

    const aggregated: AggregatedScores = {
        averageTechnical: scoringSummary.averageTechnical,
        averageDepth: scoringSummary.averageDepth,
        averageClarity: scoringSummary.averageClarity,
        averageProblemSolving: scoringSummary.averageProblemSolving,
        averageCommunication: scoringSummary.averageCommunication,
        overallAverage: scoringSummary.overallAverage,
        strongestDimension: scoringSummary.strongestDimension,
        weakestDimension: scoringSummary.weakestDimension,
    };
    session.aggregatedScores = aggregated;

    // ─── Adaptive Follow-up Strategy ───

    // Check topic mastery
    const topicMastered = hasTopicMastery(session.topicScores, topic);

    // Determine Intent & Target Difficulty
    const followUpIntent = determineFollowUpIntent(evaluation, topicMastered);
    const targetDifficulty = getNextDifficulty(currentQuestion.difficulty, evaluation.overallScore);

    // Build Question History for Anti-Repetition
    const questionHistory = session.questions.map(q => q.questionText);

    // Generate Question
    const followUp = await generateFollowUp({
        role: session.role,
        experienceLevel: session.experienceLevel,
        previousQuestion: currentQuestion.questionText,
        previousTopic: topic,
        previousDifficulty: currentQuestion.difficulty,
        technicalScore: evaluation.technicalScore,
        depthScore: evaluation.depthScore,
        clarityScore: evaluation.clarityScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        communicationScore: evaluation.communicationScore,
        weaknesses: evaluation.weaknesses,
        followUpIntent,
        targetDifficulty,
        questionHistory
    });

    const nextQuestion: GeneratedQuestion = {
        question: followUp.question,
        topic: followUp.topic,
        difficulty: followUp.difficulty
    };

    // Track intent for analytics/debugging if needed
    const generatedFromWeakness = followUp.intent; // reusing field for intent tracking

    // Add next question to session
    const nextEntry: QuestionEntry = {
        questionId: uuidv4(),
        questionText: nextQuestion.question,
        topic: nextQuestion.topic,
        difficulty: nextQuestion.difficulty,
        type: 'followup',
        generatedFromWeakness,
        answer: null,
        evaluation: null,
    };

    session.questions.push(nextEntry);
    session.totalQuestions = session.questions.length;
    session.currentQuestionIndex = session.questions.length - 1;

    await sessionService.updateSession(session);

    return {
        evaluation,
        nextQuestion,
        scoringSummary: aggregated,
        questionNumber: currentQuestionIndex + 1,
    };
}

/**
 * Get session info
 */
export async function getSessionInfo(sessionId: string) {
    const session = await sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
}

// ─── Helper Functions ───

/**
 * Check if candidate has mastered a topic (scored > 8 twice)
 */
function hasTopicMastery(topicScores: Record<string, number[]>, topic: string): boolean {
    const scores = topicScores[topic];
    if (!scores || scores.length < 2) return false;
    const highScores = scores.filter((s) => s > 8);
    return highScores.length >= 2;
}

/**
 * Find the most frequently weak dimension from the tracker
 */
function getMostFrequentWeakness(tracker: WeaknessTracker): string {
    const entries: [string, number][] = [
        ['Technical Accuracy', tracker.technicalWeakCount],
        ['Depth of Explanation', tracker.depthWeakCount],
        ['Clarity', tracker.clarityWeakCount],
        ['Problem Solving', tracker.problemSolvingWeakCount],
        ['Communication', tracker.communicationWeakCount],
    ];

    let maxKey = entries[0][0];
    let maxVal = entries[0][1];

    for (const [key, val] of entries) {
        if (val > maxVal) {
            maxVal = val;
            maxKey = key;
        }
    }

    return maxKey;
}
