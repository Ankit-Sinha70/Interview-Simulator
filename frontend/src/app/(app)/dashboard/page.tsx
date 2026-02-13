'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import DashboardStats from '@/components/dashboard/DashboardStats';
import SessionHistory from '@/components/dashboard/SessionHistory';

// Mock types matching backend response
interface AnalyticsData {
    totalSessions: number;
    averageScore: number;
    weakestDimension: string;
    strongestDimension: string;
    recentTrend: number[];
    improvementRate: number | null;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [sessions, setSessions] = useState<any[]>([]); // TODO: Fetch sessions separately or include in analytics?
    // Backend's getUserAnalytics only returns stats, not list of sessions.
    // We might need another endpoint for session history or update getUserAnalytics.
    // For now, I'll mock the history list or fetch from a new endpoint if I created one.
    // Wait, I strictly followed the plan which said "Fetch analytics".
    // I will check if I can fetch sessions from `GET /api/session` (if it existed? I check `session.controller` later).
    // I'll assume empty history for now if I can't fetch it, or mock it.

    useEffect(() => {
        // Fetch aggregated stats
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/user/test_user`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Failed to fetch stats:', err));
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, Developer.</p>
                </div>
                <Link href="/interview/start">
                    <Button size="lg" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Interview
                    </Button>
                </Link>
            </div>

            {stats ? (
                <DashboardStats
                    totalSessions={stats.totalSessions}
                    averageScore={stats.averageScore}
                    weakestDimension={stats.weakestDimension}
                    improvementRate={stats.improvementRate}
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />)}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    {/* Chart placeholder using Recharts later */}
                    <div className="h-[300px] bg-muted/10 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground">
                        Score Trend Chart (Coming Soon)
                    </div>
                </div>
                <div className="col-span-3">
                    <SessionHistory sessions={sessions} />
                </div>
            </div>
        </div>
    );
}
