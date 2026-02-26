import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
    stripePriceId: string;
    price: number;
    durationMonths: number;
    discountPercent: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionPlanSchema: Schema = new Schema({
    billingCycle: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
        required: true,
        unique: true
    },
    stripePriceId: { type: String, required: true },
    price: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
