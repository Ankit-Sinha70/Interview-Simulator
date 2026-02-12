import { v4 as uuidv4 } from 'uuid';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';
import { InterviewSession, Role, ExperienceLevel, InterviewMode, WeaknessTracker } from '../models/interviewSession.model';
import { getCurrentPromptVersion } from './promptVersion.service';

/**
 * Create a new interview session (persisted to MongoDB)
 */
export async function createSession(
    role: Role | string,
    experienceLevel: ExperienceLevel,
    mode: InterviewMode = 'text',
    userId?: string,
): Promise<InterviewSession> {
    const promptVersion = await getCurrentPromptVersion();

    const doc = await InterviewSessionModel.create({
        sessionId: uuidv4(),
        userId: userId || null,
        role,
        experienceLevel,
        mode,
        status: 'CREATED',
        questions: [],
        totalQuestions: 0,
        currentQuestionIndex: 0,
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
        completedAt: null,
    });

    return docToSession(doc);
}

/**
 * Get a session by sessionId
 */
export async function getSession(sessionId: string): Promise<InterviewSession | null> {
    const doc = await InterviewSessionModel.findOne({ sessionId });
    return doc ? docToSession(doc) : null;
}

/**
 * Update a session
 */
export async function updateSession(session: Partial<InterviewSession> & { sessionId: string }): Promise<void> {
    await InterviewSessionModel.findOneAndUpdate(
        { sessionId: session.sessionId },
        { $set: session },
        { new: true },
    );
}

/**
 * Get all sessions (for debugging)
 */
export async function getAllSessions(): Promise<InterviewSession[]> {
    const docs = await InterviewSessionModel.find().sort({ createdAt: -1 }).limit(50);
    return docs.map(docToSession);
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
    };
}
