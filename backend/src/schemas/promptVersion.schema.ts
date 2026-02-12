import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptVersionDoc extends Document {
    version: string;
    questionPrompt: string;
    evaluationPrompt: string;
    followupPrompt: string;
    reportPrompt: string;
    createdAt: Date;
}

const PromptVersionSchema = new Schema<IPromptVersionDoc>({
    version: { type: String, required: true, unique: true, index: true },
    questionPrompt: { type: String, required: true },
    evaluationPrompt: { type: String, required: true },
    followupPrompt: { type: String, required: true },
    reportPrompt: { type: String, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

export const PromptVersionModel = mongoose.model<IPromptVersionDoc>(
    'PromptVersion',
    PromptVersionSchema,
);
