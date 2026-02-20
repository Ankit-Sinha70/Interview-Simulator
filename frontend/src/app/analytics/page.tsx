'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAnalyticsSummary } from '@/services/api';
import ReadinessCard from '@/components/analytics/ReadinessCard';
import TrendChart from '@/components/analytics/TrendChart';
import RadarBreakdown from '@/components/analytics/RadarBreakdown';
import TimeStats from '@/components/analytics/TimeStats';
import FocusStats from '@/components/analytics/FocusStats';
import WeaknessInsights from '@/components/analytics/WeaknessInsights';
import InterviewHistoryTable from '@/components/analytics/InterviewHistoryTable';

// ─── Skeleton Components ───

function SkeletonCard({ className = '', height = 'h-40' }: { className?: string; height?: string }) {
    return (
        <div className={`rounded-2xl bg-card/50 border border-border/50 ${height} ${className} animate-pulse`}>
            <div className="p-6 space-y-4">
                <div className="h-3 w-32 bg-white/[0.06] rounded-full" />
                <div className="h-8 w-20 bg-white/[0.04] rounded-lg" />
                <div className="h-2 w-48 bg-white/[0.03] rounded-full" />
            </div>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-white/[0.03] rounded-lg animate-pulse" />
            </div>
            <SkeletonCard height="h-52" />
            <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard height="h-[380px]" />
                <SkeletonCard height="h-[380px]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard height="h-[350px]" />
                <SkeletonCard height="h-[350px]" />
            </div>
            <SkeletonCard height="h-48" />
            <SkeletonCard height="h-64" />
        </div>
    );
}

// ─── Main Page ───

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?._id) {
            setLoading(true);
            getAnalyticsSummary(user._id)
                .then(setData)
                .catch((err) => {
                    console.error('[Analytics]', err);
                    setError(err.message || 'Failed to load analytics');
                })
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <AnalyticsSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
                <p className="text-muted-foreground max-w-md">{error}</p>
            </div>
        );
    }

    if (!data || data.totalSessions === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl animate-bounce">📊</div>
                <h2 className="text-xl font-bold text-white">No Analytics Data Yet</h2>
                <p className="text-muted-foreground max-w-md">
                    Complete your first interview to see detailed performance trends, skill breakdowns, and AI-driven insights.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Hub</h1>
                <p className="text-muted-foreground text-sm">
                    Comprehensive overview of your interview performance. <span className="text-white font-medium">{data.totalSessions}</span> sessions analyzed.
                </p>
            </div>

            {/* 1. Readiness Overview */}
            <ReadinessCard
                readinessScore={data.readinessScore}
                trend={data.trend}
                knowledgeAverage={data.knowledgeAverage}
                timeEfficiency={data.timeEfficiency}
                focusAverage={data.focusAverage}
                consistencyScore={data.consistencyScore}
            />

            {/* 2. Performance Trend + 3. Skill Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
                <TrendChart data={data.performanceTrend} />
                <RadarBreakdown
                    skills={data.skills}
                    strongestDimension={data.strongestDimension}
                    weakestDimension={data.weakestDimension}
                />
            </div>

            {/* 4. Time Analytics + 5. Focus Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
                <TimeStats timeStats={data.timeStats} />
                <FocusStats focusStats={data.focusStats} />
            </div>

            {/* 6. Weakness Insights */}
            <WeaknessInsights
                weaknessInsights={data.weaknessInsights}
                totalSessions={data.totalSessions}
            />

            {/* 7. Interview History */}
            <InterviewHistoryTable interviews={data.interviews} />
        </div>
    );
}
