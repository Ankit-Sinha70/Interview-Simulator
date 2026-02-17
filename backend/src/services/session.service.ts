import { v4 as uuidv4 } from 'uuid';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';
import { InterviewSession, Role, ExperienceLevel, InterviewMode } from '../models/interviewSession.model';
import { isDbConnected } from '../config/db.config';
import { getCurrentPromptVersion } from './promptVersion.service';

// ─── In-Memory Fallback Store ───
const memoryStore = new Map<string, InterviewSession>();

/**
 * Create a new interview session
 */
export async function createSession(
    role: Role | string,
    experienceLevel: ExperienceLevel,
    mode: InterviewMode = 'text',
    userId?: string,
): Promise<InterviewSession> {
    const promptVersion = await getCurrentPromptVersion();
    const now = new Date().toISOString();

    const sessionData: InterviewSession = {
        sessionId: uuidv4(),
        userId: userId || undefined,
        role,
        experienceLevel,
        mode,
        status: 'CREATED',
        questions: [],
        totalQuestions: 0,
        currentQuestionIndex: 0,
        maxQuestions: 10,
        maxDurationMinutes: 50,
        endsAt: null,
        hasShownFiveMinWarning: false,
        aggregatedScores: null,
        weaknessTracker: {
            technicalWeakCount: 0,
            depthWeakCount: 0,
            clarityWeakCount: 0,
            problemSolvingWeakCount: 0,
            communicationWeakCount: 0,
        },
        topicScores: {},
        finalReport: null,
        promptVersion,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        attentionStats: null,
    };

    if (isDbConnected()) {
        const doc = await InterviewSessionModel.create(sessionData);
        return docToSession(doc);
    }

    // In-memory fallback
    memoryStore.set(sessionData.sessionId, sessionData);
    return sessionData;
}

/**
 * Get a session by sessionId
 */
export async function getSession(sessionId: string): Promise<InterviewSession | null> {
    if (isDbConnected()) {
        const doc = await InterviewSessionModel.findOne({ sessionId });
        return doc ? docToSession(doc) : null;
    }

    return memoryStore.get(sessionId) || null;
}

/**
 * Update a session
 */
export async function updateSession(session: Partial<InterviewSession> & { sessionId: string }): Promise<void> {
    if (isDbConnected()) {
        await InterviewSessionModel.findOneAndUpdate(
            { sessionId: session.sessionId },
            { $set: session },
            { new: true },
        );
        return;
    }

    // In-memory fallback
    const existing = memoryStore.get(session.sessionId);
    if (existing) {
        Object.assign(existing, session, { updatedAt: new Date().toISOString() });
        memoryStore.set(session.sessionId, existing);
    }
}

/**
 * Convert Mongoose document to plain InterviewSession object
 */
function docToSession(doc: any): InterviewSession {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        sessionId: obj.sessionId,
        userId: obj.userId,
        role: obj.role,
        experienceLevel: obj.experienceLevel,
        mode: obj.mode,
        status: obj.status,
        questions: obj.questions || [],
        totalQuestions: obj.totalQuestions || 0,
        currentQuestionIndex: obj.currentQuestionIndex || 0,
        maxQuestions: obj.maxQuestions || 10,
        maxDurationMinutes: obj.maxDurationMinutes || 50,
        endsAt: obj.endsAt?.toISOString?.() || obj.endsAt,
        hasShownFiveMinWarning: obj.hasShownFiveMinWarning || false,
        aggregatedScores: obj.aggregatedScores || null,
        weaknessTracker: obj.weaknessTracker || {
            technicalWeakCount: 0,
            depthWeakCount: 0,
            clarityWeakCount: 0,
            problemSolvingWeakCount: 0,
            communicationWeakCount: 0,
        },
        topicScores: obj.topicScores instanceof Map
            ? Object.fromEntries(obj.topicScores)
            : (obj.topicScores || {}),
        finalReport: obj.finalReport || null,
        promptVersion: obj.promptVersion || 'v1.0',
        createdAt: obj.createdAt?.toISOString?.() || obj.createdAt,
        updatedAt: obj.updatedAt?.toISOString?.() || obj.updatedAt,
        completedAt: obj.completedAt?.toISOString?.() || obj.completedAt,
        attentionStats: obj.attentionStats || null,
    };
}
