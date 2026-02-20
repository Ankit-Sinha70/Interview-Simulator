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

const MAX_QUESTIONS = 10;
const SESSION_DURATION_MINUTES = 50;

import { User } from '../models/user.model';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';

/**
 * Get active (IN_PROGRESS) session for a user
 */
export async function getActiveSession(userId: string) {
    const doc = await InterviewSessionModel.findOne({
        userId,
        status: 'IN_PROGRESS',
    }).sort({ createdAt: -1 });

    if (!doc) {
        return { hasActiveSession: false };
    }

    const questionsAnswered = doc.questions.filter((q: any) => q.answer !== null).length;
    const currentQ = doc.questions.find((q: any) => !q.answer);

    return {
        hasActiveSession: true,
        sessionId: doc.sessionId,
        questionCount: questionsAnswered,
        maxQuestions: doc.maxQuestions || 10,
        endsAt: doc.endsAt?.toISOString?.() || doc.endsAt,
        role: doc.role,
        currentQuestion: currentQ ? {
            question: currentQ.questionText,
            topic: currentQ.topic,
            difficulty: currentQ.difficulty,
        } : null,
    };
}

/**
 * Abandon an active session
 */
export async function abandonSession(sessionId: string, userId: string) {
    const doc = await InterviewSessionModel.findOne({ sessionId, userId, status: 'IN_PROGRESS' });
    if (!doc) throw new Error('No active session found to abandon');

    doc.status = 'ABANDONED';
    doc.completedAt = new Date();
    await doc.save();

    return { message: 'Session abandoned' };
}

/**
 * Auto-abandon stale sessions (IN_PROGRESS > 2 hours)
 */
export async function autoAbandonStaleSessions() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = await InterviewSessionModel.updateMany(
        { status: 'IN_PROGRESS', createdAt: { $lt: twoHoursAgo } },
        { $set: { status: 'ABANDONED', completedAt: new Date() } }
    );
    if (result.modifiedCount > 0) {
        console.log(`[AutoAbandon] Marked ${result.modifiedCount} stale sessions as ABANDONED`);
    }
}

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

    const session = await sessionService.createSession(role, experienceLevel, mode, userId);
    session.status = 'IN_PROGRESS';

    // Set deadline (50 minutes from now)
    const endsAt = new Date();
    endsAt.setMinutes(endsAt.getMinutes() + SESSION_DURATION_MINUTES);
    session.endsAt = endsAt.toISOString();
    session.maxQuestions = MAX_QUESTIONS;
    session.maxDurationMinutes = SESSION_DURATION_MINUTES;

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
        startedAt: new Date().toISOString(),
    };

    session.questions.push(questionEntry);
    session.totalQuestions = 1;
    session.currentQuestionIndex = 0;

    await sessionService.updateSession(session);

    return {
        sessionId: session.sessionId,
        question: firstQuestion,
        endsAt: session.endsAt,
        maxQuestions: MAX_QUESTIONS,
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

    // ─── STEP 1: Check Time Expired ───
    const now = new Date();
    const isTimeExpired = session.endsAt && now > new Date(session.endsAt);

    if (isTimeExpired) {
        console.log(`[Interview] Session ending: TIME_EXPIRED`);
        session.status = 'TIME_EXPIRED';
        session.completedAt = now.toISOString();

        // Still evaluate the very last answer if possible
        const answerInfo: AnswerInfo = {
            text: answer,
            answeredAt: now.toISOString(),
        };
        if (voiceMeta) answerInfo.voiceMeta = voiceMeta;
        session.questions[currentQuestionIndex].answer = answerInfo;

        const rawEval = await evaluateAnswer({
            question: session.questions[currentQuestionIndex].questionText,
            answer,
            role: session.role,
            level: session.experienceLevel,
            voiceMeta
        });
        const evalResult = scoringService.processEvaluation(rawEval, session.experienceLevel);
        session.questions[currentQuestionIndex].evaluation = evalResult;

        // Final aggregated scores update
        const evaluations = session.questions
            .filter((q) => q.evaluation !== null)
            .map((q) => q.evaluation!);
        session.aggregatedScores = scoringService.getScoringSummary(evaluations);

        await sessionService.updateSession(session);

        // Import report service dynamically to avoid circular dependencies if any
        const { generateFinalReport } = await import('./report.service');
        await generateFinalReport(session.sessionId);

        return {
            evaluation: evalResult,
            sessionEnded: true,
            reason: 'TIME_EXPIRED',
            questionNumber: currentQuestionIndex + 1
        } as any;
    }

    const currentQuestion = session.questions[currentQuestionIndex];

    // ─── STEP 2: Evaluate Answer ───
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

    // Calculate time taken
    const startedAt = new Date(currentQuestion.startedAt);
    const timeTakenSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

    // Save the answer and evaluation
    const updatedAnswerInfo: AnswerInfo = {
        text: answer,
        voiceMeta,
        voiceEvaluation: voiceEval,
        answeredAt: now.toISOString(),
    };
    currentQuestion.answer = updatedAnswerInfo;
    currentQuestion.evaluation = evaluation;
    currentQuestion.timeTakenSeconds = timeTakenSeconds;
    currentQuestion.answeredAt = now.toISOString();

    // ─── Analytics & Tracking ───
    const weakestDim = findWeakestDimension(evaluation);
    const trackerKey = WEAKNESS_DIMENSION_MAP[weakestDim];
    if (trackerKey && session.weaknessTracker) {
        session.weaknessTracker[trackerKey]++;
    }

    if (!session.topicScores) session.topicScores = {};
    const topic = currentQuestion.topic;
    if (!session.topicScores[topic]) session.topicScores[topic] = [];
    session.topicScores[topic].push(evaluation.overallScore);

    const evaluations = session.questions
        .filter((q) => q.evaluation !== null)
        .map((q) => q.evaluation!);
    const scoringSummary = scoringService.getScoringSummary(evaluations);
    session.aggregatedScores = scoringSummary;

    // ─── STEP 3: Check Question Limit ───
    const questionsAnswered = session.questions.filter(q => q.answer !== null).length;
    const isMaxQuestionsReached = questionsAnswered >= MAX_QUESTIONS;

    console.log(`[Interview] Question Limit Check: ${questionsAnswered} / ${MAX_QUESTIONS} (Session Max: ${session.maxQuestions})`);

    if (isMaxQuestionsReached) {
        console.log(`[Interview] Session ending: MAX_QUESTIONS_REACHED (${questionsAnswered}/${session.maxQuestions})`);
        session.status = 'COMPLETED';
        session.completedAt = now.toISOString();

        await sessionService.updateSession(session);

        const { generateFinalReport } = await import('./report.service');
        const finalReport = await generateFinalReport(session.sessionId);

        return {
            evaluation,
            sessionEnded: true,
            reason: 'MAX_QUESTIONS_REACHED',
            questionNumber: questionsAnswered,
            scoringSummary: session.aggregatedScores,
            finalReport
        } as any;
    }

    // ─── STEP 4: Generate Next Question (If Not Reached 10) ───
    // mastery check
    const topicMastered = hasTopicMastery(session.topicScores, topic);
    const followUpIntent = determineFollowUpIntent(evaluation, topicMastered);
    const targetDifficulty = getNextDifficulty(currentQuestion.difficulty, evaluation.overallScore);
    const questionHistory = session.questions.map(q => q.questionText);

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

    const nextEntry: QuestionEntry = {
        questionId: uuidv4(),
        questionText: followUp.question,
        topic: followUp.topic,
        difficulty: followUp.difficulty,
        type: 'followup',
        generatedFromWeakness: followUp.intent,
        answer: null,
        evaluation: null,
        startedAt: new Date().toISOString(),
    };

    session.questions.push(nextEntry);
    session.totalQuestions = session.questions.length;
    session.currentQuestionIndex = session.questions.length - 1;

    await sessionService.updateSession(session);

    return {
        evaluation,
        nextQuestion: {
            question: followUp.question,
            topic: followUp.topic,
            difficulty: followUp.difficulty
        },
        scoringSummary: session.aggregatedScores,
        questionNumber: questionsAnswered,
        sessionEnded: false
    };
}

export async function getSessionInfo(sessionId: string) {
    const session = await sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
}

/**
 * Mark 5-minute warning as shown
 */
export async function markWarningAsShown(sessionId: string) {
    const session = await sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.hasShownFiveMinWarning = true;
    await sessionService.updateSession(session);
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
