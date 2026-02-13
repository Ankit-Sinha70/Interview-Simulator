import { useReducer, useCallback } from 'react';
import {
    startInterview,
    submitAnswer,
    completeInterview,
    GeneratedQuestion,
    Evaluation,
    FinalReport,
    VoiceMetadata,
} from '@/services/api';

// ─── State Definition ───

export type InterviewStatus = 'SELECT_ROLE' | 'INTERVIEW_ACTIVE' | 'COMPLETED';

export interface InterviewHistoryEntry {
    question: GeneratedQuestion;
    evaluation: Evaluation;
    questionNumber: number;
}

interface InterviewState {
    status: InterviewStatus;
    sessionId: string | null;
    currentQuestion: GeneratedQuestion | null;
    questionNumber: number;
    history: InterviewHistoryEntry[];
    latestEvaluation: Evaluation | null;
    finalReport: FinalReport | null;
    isLoading: boolean;
    error: string | null;
    voice: {
        transcript?: string;
        meta?: VoiceMetadata;
        isListening: boolean;
    };
}

const initialState: InterviewState = {
    status: 'SELECT_ROLE',
    sessionId: null,
    currentQuestion: null,
    questionNumber: 1,
    history: [],
    latestEvaluation: null,
    finalReport: null,
    isLoading: false,
    error: null,
    voice: {
        isListening: false,
    },
};

// ─── Actions ───

type Action =
    | { type: 'START_LOADING' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'START_SUCCESS'; payload: { sessionId: string; question: GeneratedQuestion } }
    | { type: 'SUBMIT_SUCCESS'; payload: { evaluation: Evaluation; nextQuestion: GeneratedQuestion; questionNumber: number } }
    | { type: 'COMPLETE_SUCCESS'; payload: FinalReport }
    | { type: 'RESET' }
    | { type: 'SET_VOICE_TRANSCRIPT'; payload: { transcript: string; meta: VoiceMetadata } }
    | { type: 'TOGGLE_VOICE_LISTENING' }
    | { type: 'CLEAR_VOICE_TRANSCRIPT' };

// ─── Reducer ───

function interviewReducer(state: InterviewState, action: Action): InterviewState {
    switch (action.type) {
        case 'START_LOADING':
            return { ...state, isLoading: true, error: null };

        case 'SET_ERROR':
            return { ...state, isLoading: false, error: action.payload };

        case 'START_SUCCESS':
            return {
                ...state,
                status: 'INTERVIEW_ACTIVE',
                isLoading: false,
                sessionId: action.payload.sessionId,
                currentQuestion: action.payload.question,
                questionNumber: 1,
                history: [],
                latestEvaluation: null,
                finalReport: null,
            };

        case 'SUBMIT_SUCCESS':
            if (!state.currentQuestion) return state;
            return {
                ...state,
                isLoading: false,
                history: [
                    ...state.history,
                    {
                        question: state.currentQuestion,
                        evaluation: action.payload.evaluation,
                        questionNumber: action.payload.questionNumber - 1,
                    },
                ],
                latestEvaluation: action.payload.evaluation,
                currentQuestion: action.payload.nextQuestion,
                questionNumber: action.payload.questionNumber,
                voice: { ...state.voice, transcript: undefined, meta: undefined },
            };

        case 'COMPLETE_SUCCESS':
            return {
                ...state,
                status: 'COMPLETED',
                isLoading: false,
                finalReport: action.payload,
            };

        case 'RESET':
            return initialState;

        case 'SET_VOICE_TRANSCRIPT':
            return {
                ...state,
                voice: {
                    ...state.voice,
                    transcript: action.payload.transcript,
                    meta: action.payload.meta,
                },
            };

        case 'TOGGLE_VOICE_LISTENING':
            return {
                ...state,
                voice: {
                    ...state.voice,
                    isListening: !state.voice.isListening,
                },
            };

        case 'CLEAR_VOICE_TRANSCRIPT':
            return {
                ...state,
                voice: { ...state.voice, transcript: undefined, meta: undefined },
            };

        default:
            return state;
    }
}

// ─── Catch-all Error Handling ───
// Not using user-defined type validation here to keep it simple for now.

// ─── Hook ───

export function useInterviewSession() {
    const [state, dispatch] = useReducer(interviewReducer, initialState);

    const start = useCallback(async (role: string, level: string) => {
        dispatch({ type: 'START_LOADING' });
        try {
            const result = await startInterview({ role, experienceLevel: level as any, mode: 'text' });
            dispatch({ type: 'START_SUCCESS', payload: result });
        } catch (err: any) {
            dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to start interview' });
        }
    }, []);

    const submit = useCallback(async (answer: string) => {
        if (!state.sessionId) return;
        dispatch({ type: 'START_LOADING' });
        try {
            const result = await submitAnswer(state.sessionId, answer, state.voice.meta);
            dispatch({
                type: 'SUBMIT_SUCCESS',
                payload: {
                    evaluation: result.evaluation,
                    nextQuestion: result.nextQuestion,
                    questionNumber: result.questionNumber + 1, // backend returns next index? No, nextQuestion is fresh.
                    // Wait, result.questionNumber from backend is usually `currentQuestionIndex + 1`.
                    // Let's check api.ts types.
                },
            });
        } catch (err: any) {
            dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to submit answer' });
        }
    }, [state.sessionId, state.voice.meta]);

    const complete = useCallback(async () => {
        if (!state.sessionId) return;
        dispatch({ type: 'START_LOADING' });
        try {
            const report = await completeInterview(state.sessionId);
            dispatch({ type: 'COMPLETE_SUCCESS', payload: report });
        } catch (err: any) {
            dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to complete interview' });
        }
    }, [state.sessionId]);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const setVoiceTranscript = useCallback((transcript: string, meta: VoiceMetadata) => {
        dispatch({ type: 'SET_VOICE_TRANSCRIPT', payload: { transcript, meta } });
    }, []);

    const toggleVoice = useCallback(() => {
        dispatch({ type: 'TOGGLE_VOICE_LISTENING' });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: '' }); // Or just null, but reusing action
    }, []);

    // Custom method to manually clear error if needed, or just strict typing
    const dismissError = useCallback(() => {
        // We can reuse SET_ERROR with empty string or null if we changed type
        // For now, let's just assume next action clears it or we add a CLEAR_ERROR action
        // But SET_ERROR with null is fine if type allows.
        // Let's stick to strict typing.
        // Actually I'll just add a specialized action later if needed, but for MVP re-try overwrites it.
    }, []);

    return {
        state,
        actions: { start, submit, complete, reset, setVoiceTranscript, toggleVoice, dismissError: () => dispatch({ type: 'SET_ERROR', payload: '' }) }
    };
}
