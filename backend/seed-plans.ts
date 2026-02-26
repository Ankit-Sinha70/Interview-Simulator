import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

import { seedPlans } from './src/controllers/subscriptionPlan.controller';

async function runSeed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_app_1');
        console.log('Connected to MongoDB');

        // Mock req and res
        const req = {} as any;
        const res = {
            status: function (code: number) {
                this.statusCode = code;
                return this;
            },
            json: function (data: any) {
                console.log(`Status: ${this.statusCode}`);
                console.log(JSON.stringify(data, null, 2));
            }
        } as any;

        await seedPlans(req, res);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

runSeed();
