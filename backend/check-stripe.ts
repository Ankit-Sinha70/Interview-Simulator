import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../backend/.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function check() {
    try {
        const subscriptions = await stripe.subscriptions.list({
            limit: 1,
            status: 'active'
        });

        if (subscriptions.data.length === 0) {
            console.log('No active subscriptions found.');
            return;
        }

        const sub = subscriptions.data[0];
        console.log(`Checking subscription: ${sub.id}`);

        const expandedSub = await stripe.subscriptions.retrieve(sub.id, {
            expand: ['latest_invoice', 'latest_invoice.payment_intent', 'pending_setup_intent']
        });

        const invoice = expandedSub.latest_invoice as any;
        console.log('Invoice Object Keys:', Object.keys(invoice));
        console.log('Invoice Status:', invoice?.status);
        console.log('Invoice Amount Due:', invoice?.amount_due);
        console.log('Invoice Amount Paid:', invoice?.amount_paid);
        console.log('Invoice charge:', invoice?.charge);
        console.log('Invoice payment_intent:', invoice?.payment_intent?.id || invoice?.payment_intent);
        console.log('Setup Intent:', expandedSub.pending_setup_intent);

        // check payment intents for customer
        const intents = await stripe.paymentIntents.list({
            customer: sub.customer as string,
            limit: 3
        });
        console.log('\nPayment Intents for customer:');
        intents.data.forEach(pi => {
            console.log(`- PI ID: ${pi.id}, amount: ${pi.amount}, status: ${pi.status}, created: ${new Date(pi.created * 1000).toISOString()}`);
        });

        // check charges for customer
        const charges = await stripe.charges.list({
            customer: sub.customer as string,
            limit: 3
        });
        console.log('\nCharges for customer:');
        charges.data.forEach((ch: any) => {
            console.log(`- Charge ID: ${ch.id}, amount: ${ch.amount}, status: ${ch.status}, pi: ${ch.payment_intent}, invoice: ${ch.invoice}`);
        });

    } catch (err: any) {
        console.error('Error:', err.message);
    }
}

check();
