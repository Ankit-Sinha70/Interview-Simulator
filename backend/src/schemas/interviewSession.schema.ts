import mongoose, { Schema, Document } from 'mongoose';

// ─── Sub-schemas ───

const VoiceMetadataSchema = new Schema({
    durationSeconds: { type: Number, required: true },
    fillerWordCount: { type: Number, required: true },
    pauseCount: { type: Number, required: true },
    wordsPerMinute: { type: Number, required: true },
}, { _id: false });

const AnswerInfoSchema = new Schema({
    text: { type: String, required: true },
    voiceMeta: { type: VoiceMetadataSchema, default: null },
    answeredAt: { type: String, required: true },
}, { _id: false });

const EvaluationSchema = new Schema({
    technicalScore: { type: Number, required: true },
    depthScore: { type: Number, required: true },
    clarityScore: { type: Number, required: true },
    problemSolvingScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
}, { _id: false });

const QuestionEntrySchema = new Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    type: { type: String, enum: ['initial', 'followup'], required: true },
    generatedFromWeakness: { type: String, default: null },
    answer: { type: AnswerInfoSchema, default: null },
    evaluation: { type: EvaluationSchema, default: null },
    startedAt: { type: Date, default: null },
    answeredAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
}, { _id: false });

const AggregatedScoresSchema = new Schema({
    averageTechnical: { type: Number, required: true },
    averageDepth: { type: Number, required: true },
    averageClarity: { type: Number, required: true },
    averageProblemSolving: { type: Number, required: true },
    averageCommunication: { type: Number, required: true },
    overallAverage: { type: Number, required: true },
    strongestDimension: { type: String, required: true },
    weakestDimension: { type: String, required: true },
}, { _id: false });

const WeaknessTrackerSchema = new Schema({
    technicalWeakCount: { type: Number, default: 0 },
    depthWeakCount: { type: Number, default: 0 },
    clarityWeakCount: { type: Number, default: 0 },
    problemSolvingWeakCount: { type: Number, default: 0 },
    communicationWeakCount: { type: Number, default: 0 },
}, { _id: false });

const TimeAnalysisSchema = new Schema({
    averageTimePerQuestion: { type: Number, required: true },
    fastestAnswerTime: { type: Number, required: true },
    slowestAnswerTime: { type: Number, required: true },
    timeEfficiencyScore: { type: Number, required: true },
    charts: { type: [{ questionIndex: Number, timeSeconds: Number, score: Number }], default: [] },
    insights: { type: [String], default: [] },
}, { _id: false });

const FinalReportSchema = new Schema({
    averageScore: { type: Number, required: true },
    strongestAreas: { type: [String], default: [] },
    weakestAreas: { type: [String], default: [] },
    confidenceLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    hireRecommendation: { type: String, enum: ['Yes', 'Maybe', 'No'], required: true },
    hireBand: { type: String, enum: ['Strong Hire', 'Hire', 'Borderline', 'No Hire'], default: null },
    improvementRoadmap: { type: [String], default: [] },
    nextPreparationFocus: { type: [String], default: [] },
    timeAnalysis: { type: TimeAnalysisSchema, default: null },
}, { _id: false });

// ─── Main Session Schema ───

export interface IInterviewSessionDoc extends Document {
    sessionId: string;
    userId: string | null;
    role: string;
    experienceLevel: string;
    mode: string;
    status: string;
    questions: any[];
    totalQuestions: number;
    currentQuestionIndex: number;
    maxQuestions: number;
    maxDurationMinutes: number;
    endsAt: Date | null;
    hasShownFiveMinWarning: boolean;
    aggregatedScores: any | null;
    weaknessTracker: any;
    topicScores: Map<string, number[]>;
    finalReport: any | null;
    promptVersion: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    attentionStats: {
        focusScore: number;
        totalLookAwayTime: number;
        longestLookAway: number;
        distractionEvents: number;
        focusCategory: string;
    } | null;
}

const InterviewSessionSchema = new Schema<IInterviewSessionDoc>({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    role: { type: String, required: true },
    experienceLevel: { type: String, enum: ['Junior', 'Mid', 'Senior'], required: true },
    mode: { type: String, enum: ['text', 'voice', 'hybrid'], default: 'text' },
    status: { type: String, enum: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIME_EXPIRED', 'MAX_QUESTIONS_REACHED'], default: 'CREATED', index: true },
    questions: { type: [QuestionEntrySchema] as any, default: [] },
    totalQuestions: { type: Number, default: 0 },
    currentQuestionIndex: { type: Number, default: 0 },
    maxQuestions: { type: Number, default: 10 },
    maxDurationMinutes: { type: Number, default: 60 },
    endsAt: { type: Date, default: null },
    hasShownFiveMinWarning: { type: Boolean, default: false },
    aggregatedScores: { type: AggregatedScoresSchema, default: null },
    weaknessTracker: { type: WeaknessTrackerSchema, default: () => ({}) },
    topicScores: { type: Map, of: [Number], default: () => new Map() },
    finalReport: { type: FinalReportSchema, default: null },
    promptVersion: { type: String, default: 'v1.0' },
    completedAt: { type: Date, default: null },
    attentionStats: {
        type: {
            focusScore: { type: Number, required: true },
            totalLookAwayTime: { type: Number, required: true },
            longestLookAway: { type: Number, required: true },
            distractionEvents: { type: Number, required: true },
            focusCategory: { type: String, required: true },
        }, default: null
    },
}, {
    timestamps: true, // auto createdAt + updatedAt
});

export const InterviewSessionModel = mongoose.model<IInterviewSessionDoc>(
    'InterviewSession',
    InterviewSessionSchema,
);
