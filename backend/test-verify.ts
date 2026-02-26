import * as dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';
import mongoose from 'mongoose';
import { User } from './src/models/user.model';
import * as subService from './src/services/subscription.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function testFix() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_simulator');
    console.log('Connected to DB');

    // get the latest pro user
    const user = await User.findOne({ planType: 'PRO' }).sort({ updatedAt: -1 });
    if (!user) return console.log('no pro user');

    // get their checkout sessions
    const sessions = await stripe.checkout.sessions.list({ customer: user.stripeCustomerId, limit: 1 });
    if (!sessions.data.length) return console.log('no checkout sessions');

    const session = sessions.data[0];
    console.log('Testing verifySession on sessionId:', session.id);

    // Call verifySession which contains our fallback logic
    const res = await subService.verifySession(session.id);
    console.log('verifySession result:', res);

    // Check DB again
    const updatedUser = await User.findById(user._id);
    console.log('DB stripePaymentIntentId after verifySession:', updatedUser?.stripePaymentIntentId);

    process.exit(0);
}

testFix();
