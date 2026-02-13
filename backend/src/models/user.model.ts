
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;

    rolePreference?: string;
    experienceLevel?: string;

    planType: 'FREE' | 'PRO';
    subscriptionStatus: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;

    interviewsUsedThisMonth: number;
    monthlyResetDate: Date;

    createdAt: Date;
    updatedAt: Date;

    checkReset(): boolean;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    rolePreference: { type: String },
    experienceLevel: { type: String },

    planType: { type: String, enum: ['FREE', 'PRO'], default: 'FREE' },
    subscriptionStatus: { type: String, enum: ['ACTIVE', 'CANCELED', 'PAST_DUE'], default: 'ACTIVE' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    interviewsUsedThisMonth: { type: Number, default: 0 },
    monthlyResetDate: { type: Date, default: () => new Date() },
}, {
    timestamps: true
});

// Reset monthly usage if needed
UserSchema.methods.checkReset = function () {
    const now = new Date();
    if (now > this.monthlyResetDate) {
        this.interviewsUsedThisMonth = 0;
        // set next reset date to 1 month from now
        const nextReset = new Date(now);
        nextReset.setMonth(nextReset.getMonth() + 1);
        this.monthlyResetDate = nextReset;
        return true;
    }
    return false;
};

export const User = mongoose.model<IUser>('User', UserSchema);
