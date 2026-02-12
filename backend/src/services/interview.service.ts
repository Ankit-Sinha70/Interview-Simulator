import { v4 as uuidv4 } from 'uuid';
import {
    InterviewSession,
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
} from '../models/interviewSession.model';
import * as sessionService from './session.service';
import * as scoringService from './scoring.service';
import { generateQuestion } from '../ai/question.engine';
import { evaluateAnswer } from '../ai/evaluation.engine';
import { generateFollowUp } from '../ai/followup.engine';
import {
    getNextDifficulty,
    shouldProbeDeeper,
    shouldAskClarifying,
    findWeakestDimension,
} from '../utils/scoreCalculator';

/**
 * Start a new interview session
 */
export async function startInterview(
    role: Role | string,
    experienceLevel: ExperienceLevel,
    mode: InterviewMode = 'text',
) {
    // Create session
    const session = sessionService.createSession(role, experienceLevel, mode);
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
    sessionService.updateSession(session);

    return {
        sessionId: session.sessionId,
        question: firstQuestion,
    };
}

/**
 * Process an answer for the current question
 * Evaluates the answer, determines adaptive follow-up strategy
 */
export async function processAnswer(
    sessionId: string,
    answer: string,
    voiceMeta?: VoiceMetadata,
) {
    const session = sessionService.getSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }
    if (session.status !== 'IN_PROGRESS') {
        throw new Error('Session is not in progress');
    }

    // Find the current unanswered question
    const currentQuestionIndex = session.questions.findIndex((q) => q.answer === null);
    if (currentQuestionIndex === -1) {
        throw new Error('No pending question found');
    }

    const currentQuestion = session.questions[currentQuestionIndex];

    // Save the answer with voice metadata
    const answerInfo: AnswerInfo = {
        text: answer,
        answeredAt: new Date().toISOString(),
    };
    if (voiceMeta) {
        answerInfo.voiceMeta = voiceMeta;
        // Update session mode to hybrid if voice is used after text start
        if (session.mode === 'text') {
            session.mode = 'hybrid';
        }
    }
    currentQuestion.answer = answerInfo;

    // Evaluate the answer using AI (with voice context if available)
    const rawEvaluation: Evaluation = await evaluateAnswer({
        question: currentQuestion.questionText,
        answer: answer,
        role: session.role,
        level: session.experienceLevel,
        voiceMeta,
    });

    // Process scores with role-aware weighting
    const evaluation = scoringService.processEvaluation(rawEvaluation, session.experienceLevel);
    currentQuestion.evaluation = evaluation;

    // Get aggregated scoring summary
    const completedEvaluations = session.questions
        .filter((q) => q.evaluation !== null)
        .map((q) => q.evaluation!);

    const scoringSummary = scoringService.getScoringSummary(completedEvaluations);

    // Update aggregated scores on session
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
    let nextQuestion: GeneratedQuestion;
    let questionType: 'initial' | 'followup' = 'followup';
    let generatedFromWeakness: string | undefined;

    // Rule: If technicalScore < 5, ask a clarifying follow-up on the same topic
    if (shouldAskClarifying(evaluation)) {
        const followUp: FollowUpQuestion = await generateFollowUp({
            weaknesses: evaluation.weaknesses,
            topic: currentQuestion.topic,
            summary: answer.substring(0, 500),
        });

        const nextDifficulty = getNextDifficulty(currentQuestion.difficulty, evaluation.overallScore);
        generatedFromWeakness = 'technicalAccuracy';

        nextQuestion = {
            question: followUp.question,
            topic: followUp.focusArea,
            difficulty: nextDifficulty,
        };
    }
    // Rule: If depth is weakest and < 6, probe deeper
    else if (shouldProbeDeeper(evaluation)) {
        const followUp: FollowUpQuestion = await generateFollowUp({
            weaknesses: ['Needs deeper explanation', ...evaluation.weaknesses],
            topic: currentQuestion.topic,
            summary: answer.substring(0, 500),
        });

        const nextDifficulty = getNextDifficulty(currentQuestion.difficulty, evaluation.overallScore);
        generatedFromWeakness = 'depth';

        nextQuestion = {
            question: followUp.question,
            topic: followUp.focusArea,
            difficulty: nextDifficulty,
        };
    }
    // Default: Generate adaptive follow-up based on weaknesses
    else {
        const weakestDim = findWeakestDimension(evaluation);
        const followUp: FollowUpQuestion = await generateFollowUp({
            weaknesses: evaluation.weaknesses,
            topic: currentQuestion.topic,
            summary: answer.substring(0, 500),
        });

        const nextDifficulty = getNextDifficulty(currentQuestion.difficulty, evaluation.overallScore);
        generatedFromWeakness = weakestDim;

        nextQuestion = {
            question: followUp.question,
            topic: followUp.focusArea,
            difficulty: nextDifficulty,
        };
    }

    // Add next question to session
    const nextEntry: QuestionEntry = {
        questionId: uuidv4(),
        questionText: nextQuestion.question,
        topic: nextQuestion.topic,
        difficulty: nextQuestion.difficulty,
        type: questionType,
        generatedFromWeakness,
        answer: null,
        evaluation: null,
    };

    session.questions.push(nextEntry);
    session.totalQuestions = session.questions.length;
    session.currentQuestionIndex = session.questions.length - 1;
    sessionService.updateSession(session);

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
export function getSessionInfo(sessionId: string) {
    const session = sessionService.getSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }
    return session;
}
