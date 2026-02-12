import { v4 as uuidv4 } from 'uuid';
import { InterviewSession, Role, ExperienceLevel, InterviewMode } from '../models/interviewSession.model';

// In-memory session store
const sessions = new Map<string, InterviewSession>();

/**
 * Create a new interview session
 */
export function createSession(
    role: Role | string,
    experienceLevel: ExperienceLevel,
    mode: InterviewMode = 'text',
    userId?: string,
): InterviewSession {
    const session: InterviewSession = {
        sessionId: uuidv4(),
        userId,
        role,
        experienceLevel,
        mode,
        status: 'CREATED',
        questions: [],
        totalQuestions: 0,
        currentQuestionIndex: 0,
        aggregatedScores: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
    };

    sessions.set(session.sessionId, session);
    return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): InterviewSession | undefined {
    return sessions.get(sessionId);
}

/**
 * Update a session
 */
export function updateSession(session: InterviewSession): void {
    sessions.set(session.sessionId, session);
}

/**
 * Get all sessions (for debugging)
 */
export function getAllSessions(): InterviewSession[] {
    return Array.from(sessions.values());
}
