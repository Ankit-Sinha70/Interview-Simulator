'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession, getWelcomeOfferStatus, WelcomeOfferStatus } from '@/services/api';
import ReportView from '@/components/ReportView';
import { useAuth } from '@/context/AuthContext';

export default function ReportPage() {
    const { user } = useAuth();
    const params = useParams();
    const sessionId = params.id as string;
    const [report, setReport] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Welcome offer state
    const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
    const [welcomeOfferData, setWelcomeOfferData] = useState<WelcomeOfferStatus | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        getSession(sessionId).then(data => {
            if (data) {
                setReport(data.finalReport);
                setSession(data);
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [sessionId]);

    // Check welcome offer eligibility after report loads
    useEffect(() => {
        if (!report || loading) return;

        getWelcomeOfferStatus()
            .then((data) => {
                if (data.showOffer) {
                    setWelcomeOfferData(data);
                    // Show after 1.5s for better UX — let the user see the report first
                    setTimeout(() => setShowWelcomeOffer(true), 1500);
                }
            })
            .catch((err) => console.error('Failed to check welcome offer:', err));
    }, [report, loading]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading report...</div>;
    if (!report) return <div className="p-8 text-center">No report found.</div>;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <ReportView
                report={report}
                scores={session?.aggregatedScores}
                attentionStats={session?.attentionStats}
                onNewSession={() => window.location.href = '/interview/start'}
                isPro={user?.planType === 'PRO'}
            />

            {/* Welcome Offer Modal — shown after first completed interview */}
            {welcomeOfferData && (
                <WelcomeOfferModal
                    isOpen={showWelcomeOffer}
                    onClose={() => setShowWelcomeOffer(false)}
                    expiresAt={welcomeOfferData.expiresAt}
                    savings={welcomeOfferData.savings}
                    onUpgrade={async () => {
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-checkout-session`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ billingCycle: 'YEARLY', couponCode: 'WELCOME30' }),
                            });
                            const data = await res.json();
                            if (data.url) {
                                window.location.href = data.url;
                            }
                        } catch (err) {
                            console.error('Welcome offer upgrade failed:', err);
                        }
                    }}
                />
            )}
        </div>
    );
}

