import { Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const BASE_PRODUCT_NAME = 'AI Interview Pro';

export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ durationMonths: 1 });
        res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const seedPlans = async (req: Request, res: Response) => {
    try {
        // Find existing base product or create it
        let product;
        const products = await stripe.products.list({ limit: 100 });
        const existingProduct = products.data.find(p => p.name === BASE_PRODUCT_NAME);

        if (existingProduct) {
            product = existingProduct;
        } else {
            product = await stripe.products.create({ name: BASE_PRODUCT_NAME });
            console.log(`Created new Stripe Product: ${product.id}`);
        }

        const tierDefinitions = [
            { cycle: 'MONTHLY', months: 1, price: 20 },
            { cycle: 'QUARTERLY', months: 3, price: 54 },
            { cycle: 'HALF_YEARLY', months: 6, price: 96 },
            { cycle: 'YEARLY', months: 12, price: 168 }
        ];

        const results = [];

        for (const tier of tierDefinitions) {
            // Check if plan already exists in DB
            let plan = await SubscriptionPlan.findOne({ billingCycle: tier.cycle, isActive: true });

            if (!plan) {
                // Create Stripe Price
                const interval = tier.months === 12 ? 'year' : 'month';
                const interval_count = tier.months === 12 ? 1 : tier.months;

                const priceObj = await stripe.prices.create({
                    product: product.id,
                    unit_amount: tier.price * 100, // cents
                    currency: 'usd',
                    recurring: {
                        interval,
                        interval_count
                    }
                });

                // Calculate discount relative to monthly base price ($20)
                const baseMonthlyPrice = 20;
                const totalCostAtBase = baseMonthlyPrice * tier.months;
                const discount = totalCostAtBase > tier.price ? Math.round(((totalCostAtBase - tier.price) / totalCostAtBase) * 100) : 0;

                // Save to DB
                plan = await SubscriptionPlan.create({
                    billingCycle: tier.cycle,
                    stripePriceId: priceObj.id,
                    price: tier.price,
                    durationMonths: tier.months,
                    discountPercent: discount,
                    isActive: true
                });

                results.push({ cycle: tier.cycle, action: 'created', stripePriceId: priceObj.id });
            } else {
                results.push({ cycle: tier.cycle, action: 'exists', stripePriceId: plan.stripePriceId });
            }
        }

        res.status(200).json({ success: true, message: 'Plans seeded successfully', data: results });
    } catch (error: any) {
        console.error('Error seeding plans:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

export const updatePrice = async (req: Request, res: Response) => {
    try {
        const { billingCycle, newPrice } = req.body;

        if (!billingCycle || !newPrice) {
            return res.status(400).json({ success: false, error: { message: 'billingCycle and newPrice are required' } });
        }

        const existingPlan = await SubscriptionPlan.findOne({ billingCycle, isActive: true });
        if (!existingPlan) {
            return res.status(404).json({ success: false, error: { message: `Active plan for ${billingCycle} not found.` } });
        }

        // Fetch current price to get the Product ID
        const oldPriceObj = await stripe.prices.retrieve(existingPlan.stripePriceId);

        // Create new Price on the same Product
        const interval = existingPlan.durationMonths === 12 ? 'year' : 'month';
        const interval_count = existingPlan.durationMonths === 12 ? 1 : existingPlan.durationMonths;

        const newPriceObj = await stripe.prices.create({
            product: oldPriceObj.product as string,
            unit_amount: newPrice * 100, // convert to cents
            currency: 'usd',
            recurring: {
                interval,
                interval_count
            }
        });

        // Archive old price in Stripe so no new checkouts use it
        await stripe.prices.update(existingPlan.stripePriceId, { active: false });

        // Calculate new discount (assuming monthly base is 20 if changing a longer plan)
        let newDiscount = 0;
        if (billingCycle === 'MONTHLY') {
            newDiscount = 0;
        } else {
            const baseMonthly = await SubscriptionPlan.findOne({ billingCycle: 'MONTHLY', isActive: true });
            const baseRate = baseMonthly ? baseMonthly.price : 20;
            const totalCostAtBase = baseRate * existingPlan.durationMonths;
            if (totalCostAtBase > newPrice) {
                newDiscount = Math.round(((totalCostAtBase - newPrice) / totalCostAtBase) * 100);
            }
        }

        // Deactivate old plan in DB and create new one (retaining history)
        existingPlan.isActive = false;
        await existingPlan.save();

        const newPlan = await SubscriptionPlan.create({
            billingCycle,
            stripePriceId: newPriceObj.id,
            price: newPrice,
            durationMonths: existingPlan.durationMonths,
            discountPercent: newDiscount,
            isActive: true
        });

        res.status(200).json({ success: true, message: 'Price updated successfully', data: newPlan });
    } catch (error: any) {
        console.error('Error updating price:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
