
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;

    rolePreference?: string;
    experienceLevel?: string;

    planType: 'FREE' | 'PRO';
    subscriptionStatus: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    billingCycle?: 'MONTHLY' | 'ANNUAL' | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;

    resetPasswordToken?: string;
    resetPasswordExpires?: Date;

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
    billingCycle: { type: String, enum: ['MONTHLY', 'ANNUAL', null], default: null },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

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
