'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import DashboardStats from '@/components/dashboard/DashboardStats';
import SessionHistory from '@/components/dashboard/SessionHistory';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics } from '@/services/api';

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
    const { user } = useAuth();
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [sessions, setSessions] = useState<any[]>([]); // TODO: Fetch sessions separately

    // Check if user is logged in
    useEffect(() => {
        if (user) {
            getUserAnalytics(user._id)
                .then(data => setStats(data))
                .catch(err => console.error('Failed to fetch stats:', err));
        }
    }, [user]);

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
