'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSession } from '@/services/api';
import ReportView from '@/components/ReportView';

export default function ReportPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const [report, setReport] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading report...</div>;
    if (!report) return <div className="p-8 text-center">No report found.</div>;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <ReportView
                report={report}
                scores={session?.aggregatedScores}
                attentionStats={session?.attentionStats}
                onNewSession={() => window.location.href = '/interview/start'}
            />
        </div>
    );
}
