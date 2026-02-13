'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    getSession,
    submitAnswer,
    completeInterview,
    GeneratedQuestion,
    Evaluation,
    FinalReport,
    VoiceMetadata
} from '@/services/api';

// Reuse types from original hook or api
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
    });

    // ─── Load Session ───
    useEffect(() => {
        if (!sessionId) return;

        const load = async () => {
            try {
                const session = await getSession(sessionId);

                // Transform session data to state
                // This depends on what backend returns. 
                // We likely need to reconstruct history from session.questions

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

                // Find current question (unanswered)
                const currentQ = session.questions.find((q: any) => !q.answer);

                // Check if completed
                if (session.status === 'COMPLETED') {
                    setState(s => ({
                        ...s,
                        status: 'COMPLETED',
                        history,
                        finalReport: session.finalReport
                    }));
                    return;
                }

                setState(s => ({
                    ...s,
                    status: 'READY',
                    history,
                    currentQuestion: currentQ ? {
                        question: currentQ.questionText,
                        topic: currentQ.topic,
                        difficulty: currentQ.difficulty
                    } : null,
                    questionNumber: currentQ ? (history.length + 1) : history.length,
                    latestEvaluation: history.length > 0 ? history[history.length - 1].evaluation : null
                }));

            } catch (err: any) {
                setState(s => ({ ...s, status: 'ERROR', error: err.message }));
            }
        };
        load();
    }, [sessionId]);

    // ─── Actions ───
    const submit = async (answer: string, voiceMeta?: VoiceMetadata) => {
        setState(s => ({ ...s, isSubmitting: true }));
        try {
            const result = await submitAnswer(sessionId, answer, voiceMeta);

            setState(s => ({
                ...s,
                isSubmitting: false,
                latestEvaluation: result.evaluation,
                currentQuestion: result.nextQuestion,
                questionNumber: result.questionNumber, // Check if this matches backend
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

    const complete = async () => {
        setState(s => ({ ...s, isSubmitting: true }));
        try {
            const report = await completeInterview(sessionId);
            setState(s => ({
                ...s,
                status: 'COMPLETED',
                isSubmitting: false,
                finalReport: report
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
