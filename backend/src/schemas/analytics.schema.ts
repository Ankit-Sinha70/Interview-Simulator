import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsDoc extends Document {
    sessionId: string;
    userId: string | null;
    role: string;
    experienceLevel: string;
    mode: string;
    averageScore: number;
    weakestDimension: string;
    strongestDimension: string;
    questionsCount: number;
    averageTimePerQuestion: number;
    voiceConfidenceScore: number | null;
    hireBand: string | null;
    difficultyConsistency: number; // % of questions within allowed band
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
    weakestDimension: { type: String, required: true },
    strongestDimension: { type: String, required: true },
    questionsCount: { type: Number, required: true },
    averageTimePerQuestion: { type: Number, default: 0 },
    voiceConfidenceScore: { type: Number, default: null },
    hireBand: { type: String, default: null },
    difficultyConsistency: { type: Number, default: 100 },
    promptVersion: { type: String, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

// Compound indexes for analytics queries
AnalyticsSchema.index({ role: 1, experienceLevel: 1 });
AnalyticsSchema.index({ createdAt: -1 });

export const AnalyticsModel = mongoose.model<IAnalyticsDoc>('Analytics', AnalyticsSchema);
