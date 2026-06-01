import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillGap {
    skill: string;
    expectedScore: number;
    candidateScore: number;
}

export interface IRoadmapWeek {
    week: number;
    topic: string;
    focusItems: string[];
}

export interface IProgressTrendPoint {
    date: string;
    readiness: number;
    technical: number;
    communication: number;
    confidence: number;
}

export interface ICareerGrowthDoc extends Document {
    userId: string;
    readinessScore: number;
    readinessBreakdown: {
        technical: number;
        communication: number;
        confidence: number;
        consistency: number;
    };
    roleSuitability: string;
    aiRecommendation: string;
    skillGap: ISkillGap[];
    skillGapInsight: string;
    coachMessage: string;
    coachRecommendations: string[];
    roadmap: IRoadmapWeek[];
    resumeAlignment: {
        alignmentScore: number;
        insights: string[];
        strongSkills: string[];
        improvementSkills: string[];
    };
    weakAreas: string[];
    progressHistory: IProgressTrendPoint[];
    resumeMatchScore?: number;
    githubMatchScore?: number;
    overallMatchScore?: number;
    resumeValidationScore?: number;
    githubValidationScore?: number;
    recruiterRecommendation?: {
        recommendation: 'YES' | 'NO';
        reason: string;
        concerns: string[];
    };
    detectedTechnologies?: string[];
    topRepositories?: string[];
    strongestAreas?: string[];
    moderateAreas?: string[];
    githubWeakAreas?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const CareerGrowthSchema = new Schema<ICareerGrowthDoc>({
    userId: { type: String, required: true, unique: true, index: true },
    readinessScore: { type: Number, default: 0 },
    readinessBreakdown: {
        technical: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        consistency: { type: Number, default: 0 }
    },
    roleSuitability: { type: String, default: '' },
    aiRecommendation: { type: String, default: '' },
    skillGap: [{
        skill: { type: String, required: true },
        expectedScore: { type: Number, required: true },
        candidateScore: { type: Number, required: true }
    }],
    skillGapInsight: { type: String, default: '' },
    coachMessage: { type: String, default: '' },
    coachRecommendations: [{ type: String }],
    roadmap: [{
        week: { type: Number, required: true },
        topic: { type: String, required: true },
        focusItems: [{ type: String }]
    }],
    resumeAlignment: {
        alignmentScore: { type: Number, default: 0 },
        insights: [{ type: String }],
        strongSkills: [{ type: String }],
        improvementSkills: [{ type: String }]
    },
    weakAreas: [{ type: String }],
    progressHistory: [{
        date: { type: String, required: true },
        readiness: { type: Number, required: true },
        technical: { type: Number, required: true },
        communication: { type: Number, required: true },
        confidence: { type: Number, required: true }
    }],
    resumeMatchScore: { type: Number },
    githubMatchScore: { type: Number },
    overallMatchScore: { type: Number },
    resumeValidationScore: { type: Number },
    githubValidationScore: { type: Number },
    recruiterRecommendation: {
        recommendation: { type: String, enum: ['YES', 'NO'] },
        reason: { type: String },
        concerns: [{ type: String }]
    },
    detectedTechnologies: [{ type: String }],
    topRepositories: [{ type: String }],
    strongestAreas: [{ type: String }],
    moderateAreas: [{ type: String }],
    githubWeakAreas: [{ type: String }]
}, {
    timestamps: true
});

export const CareerGrowth = mongoose.model<ICareerGrowthDoc>('CareerGrowth', CareerGrowthSchema);
