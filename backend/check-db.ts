import mongoose from 'mongoose';
import { User } from './src/models/user.model';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_simulator');
        const user = await User.findOne({ planType: 'PRO' }).sort({ updatedAt: -1 });
        if (!user) {
            console.log('No PRO users found.');
            process.exit(0);
        }
        console.log('Latest PRO User ID:', user._id);
        console.log('planType:', user.planType);
        console.log('subscriptionStatus:', user.subscriptionStatus);
        console.log('stripePaymentIntentId:', user.stripePaymentIntentId);
        console.log('subscriptionStartDate:', user.subscriptionStartDate);
        console.log('stripeCustomerId:', user.stripeCustomerId);
        console.log('stripeSubscriptionId:', user.stripeSubscriptionId);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
