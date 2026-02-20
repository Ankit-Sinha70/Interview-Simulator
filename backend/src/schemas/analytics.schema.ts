import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsDoc extends Document {
    sessionId: string;
    userId: string | null;
    role: string;
    experienceLevel: string;
    mode: string;
    averageScore: number;
    averageTechnical: number;
    averageDepth: number;
    averageClarity: number;
    averageProblemSolving: number;
    averageCommunication: number;
    weakestDimension: string;
    strongestDimension: string;
    questionsCount: number;
    averageTimePerQuestion: number;
    fastestAnswerTime: number;
    slowestAnswerTime: number;
    timeEfficiencyScore: number;
    totalDurationSeconds: number;
    focusScore: number;
    distractionEvents: number;
    focusCategory: string | null;
    voiceConfidenceScore: number | null;
    hireBand: string | null;
    promptVersion: string;
    createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalyticsDoc>({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    role: { type: String, required: true, index: true },
    experienceLevel: { type: String, enum: ['Junior', 'Mid', 'Senior'], required: true },
    mode: { type: String, enum: ['text', 'voice', 'hybrid'], required: true },
    averageScore: { type: Number, required: true },
    averageTechnical: { type: Number, default: 0 },
    averageDepth: { type: Number, default: 0 },
    averageClarity: { type: Number, default: 0 },
    averageProblemSolving: { type: Number, default: 0 },
    averageCommunication: { type: Number, default: 0 },
    weakestDimension: { type: String, required: true },
    strongestDimension: { type: String, required: true },
    questionsCount: { type: Number, required: true },
    averageTimePerQuestion: { type: Number, default: 0 },
    fastestAnswerTime: { type: Number, default: 0 },
    slowestAnswerTime: { type: Number, default: 0 },
    timeEfficiencyScore: { type: Number, default: 0 },
    totalDurationSeconds: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    distractionEvents: { type: Number, default: 0 },
    focusCategory: { type: String, default: null },
    voiceConfidenceScore: { type: Number, default: null },
    hireBand: { type: String, default: null },
    promptVersion: { type: String, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

// Compound indexes for analytics queries
AnalyticsSchema.index({ role: 1, experienceLevel: 1 });
AnalyticsSchema.index({ createdAt: -1 });

export const AnalyticsModel = mongoose.model<IAnalyticsDoc>('Analytics', AnalyticsSchema);
