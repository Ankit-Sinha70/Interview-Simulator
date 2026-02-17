'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    getSession,
    submitAnswer,
    completeInterview,
    GeneratedQuestion,
    Evaluation,
    FinalReport,
    VoiceMetadata,
} from '@/services/api';

export interface InterviewHistoryEntry {
    question: GeneratedQuestion;
    evaluation: Evaluation;
    questionNumber: number;
}

interface ActiveSessionState {
    status: 'LOADING' | 'READY' | 'COMPLETED' | 'ERROR';
    currentQuestion: GeneratedQuestion | null;
    questionNumber: number;
    history: InterviewHistoryEntry[];
    latestEvaluation: Evaluation | null;
    finalReport: FinalReport | null;
    error: string | null;
    isSubmitting: boolean;
    // New Fields
    endsAt: string | null;
    hasShownFiveMinWarning: boolean;
    maxQuestions: number;
    sessionEnded: boolean;
    endReason: string | null;
}

export function useActiveSession(sessionId: string) {
    const [state, setState] = useState<ActiveSessionState>({
        status: 'LOADING',
        currentQuestion: null,
        questionNumber: 0,
        history: [],
        latestEvaluation: null,
        finalReport: null,
        error: null,
        isSubmitting: false,
        endsAt: null,
        hasShownFiveMinWarning: false,
        maxQuestions: 15,
        sessionEnded: false,
        endReason: null,
    });

    // ─── Load Session ───
    useEffect(() => {
        if (!sessionId) return;

        const load = async () => {
            try {
                const session = await getSession(sessionId);

                const history: InterviewHistoryEntry[] = session.questions
                    .filter((q: any) => q.answer && q.evaluation)
                    .map((q: any, index: number) => ({
                        question: {
                            question: q.questionText,
                            topic: q.topic,
                            difficulty: q.difficulty
                        },
                        evaluation: q.evaluation,
                        questionNumber: index + 1
                    }));

                const currentQ = session.questions.find((q: any) => !q.answer);

                const isCompleted = ['COMPLETED', 'TIME_EXPIRED', 'MAX_QUESTIONS_REACHED'].includes(session.status);

                setState(s => ({
                    ...s,
                    status: isCompleted ? 'COMPLETED' : 'READY',
                    history,
                    currentQuestion: currentQ ? {
                        question: currentQ.questionText,
                        topic: currentQ.topic,
                        difficulty: currentQ.difficulty
                    } : null,
                    questionNumber: currentQ ? (history.length + 1) : history.length,
                    latestEvaluation: history.length > 0 ? history[history.length - 1].evaluation : null,
                    finalReport: session.finalReport,
                    endsAt: session.endsAt || null,
                    hasShownFiveMinWarning: session.hasShownFiveMinWarning || false,
                    maxQuestions: session.maxQuestions || 15,
                    sessionEnded: isCompleted,
                    endReason: isCompleted ? session.status : null,
                }));

            } catch (err: any) {
                setState(s => ({ ...s, status: 'ERROR', error: err.message }));
            }
        };
        load();
    }, [sessionId]);

    // ─── Actions ───
    const complete = useCallback(async (attentionStats?: any) => {
        setState(s => ({ ...s, isSubmitting: true }));
        try {
            const report = await completeInterview(sessionId, attentionStats);
            setState(s => ({
                ...s,
                status: 'COMPLETED',
                isSubmitting: false,
                finalReport: report,
                sessionEnded: true,
            }));
        } catch (err: any) {
            setState(s => ({ ...s, isSubmitting: false, error: err.message }));
        }
    }, [sessionId]);

    const submit = async (answer: string, voiceMeta?: VoiceMetadata) => {
        setState(s => ({ ...s, isSubmitting: true }));
        try {
            const result = await submitAnswer(sessionId, answer, voiceMeta);

            if (result.sessionEnded) {
                // If backend says it's over, still show the evaluation then auto-complete
                setState(s => ({
                    ...s,
                    latestEvaluation: result.evaluation,
                    sessionEnded: true,
                    endReason: result.reason || 'TERMINATED',
                    history: [
                        ...s.history,
                        {
                            question: s.currentQuestion!,
                            evaluation: result.evaluation,
                            questionNumber: s.questionNumber
                        }
                    ]
                }));

                // Trigger full completion for final report
                await complete();
                return;
            }

            setState(s => ({
                ...s,
                isSubmitting: false,
                latestEvaluation: result.evaluation,
                currentQuestion: result.nextQuestion,
                questionNumber: result.questionNumber,
                history: [
                    ...s.history,
                    {
                        question: s.currentQuestion!,
                        evaluation: result.evaluation,
                        questionNumber: s.questionNumber
                    }
                ]
            }));
        } catch (err: any) {
            setState(s => ({ ...s, isSubmitting: false, error: err.message }));
        }
    };

    return {
        state,
        actions: { submit, complete }
    };
}
