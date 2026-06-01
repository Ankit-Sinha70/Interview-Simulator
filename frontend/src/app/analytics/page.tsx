'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    getCareerDashboard, 
    refreshCareerDashboard, 
    getAnalyticsSummary,
    CareerDashboardData,
    AnalyticsSummaryResponse
} from '@/services/api';
import { 
    ReadinessMeter, 
    SkillGapMatrix, 
    AICoachPanel, 
    RoadmapPlanner, 
    ResumeAlignmentCard,
    MatchBreakdownCard,
    ValidationScoresCard,
    RecruiterRecommendationCard 
} from '@/components/career/CareerDashboardComponents';
import TrendChart from '@/components/analytics/TrendChart';
import RadarBreakdown from '@/components/analytics/RadarBreakdown';
import TimeStats from '@/components/analytics/TimeStats';
import FocusStats from '@/components/analytics/FocusStats';
import WeaknessInsights from '@/components/analytics/WeaknessInsights';
import InterviewHistoryTable from '@/components/analytics/InterviewHistoryTable';
import SessionIntegrity from '@/components/analytics/SessionIntegrity';
import LockedSection from '@/components/LockedSection';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, X, LayoutDashboard, Target, Compass, Award } from 'lucide-react';

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

function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6">
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

export default function AnalyticsPage() {
    return (
        <React.Suspense fallback={<DashboardSkeleton />}>
            <CareerDashboardContent />
        </React.Suspense>
    );
}

function CareerDashboardContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [careerData, setCareerData] = useState<CareerDashboardData | null>(null);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [activeTab, setActiveTab] = useState<'growth' | 'history' | 'coaching'>('growth');

    useEffect(() => {
        if (searchParams.get('upgraded') === 'true') {
            setShowCelebration(true);
            router.replace('/analytics', { scroll: false });
        }
    }, [searchParams, router]);

    const loadData = async (force = false) => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const [cData, aData] = await Promise.all([
                force ? refreshCareerDashboard() : getCareerDashboard(),
                getAnalyticsSummary(user._id)
            ]);
            setCareerData(cData);
            setAnalyticsData(aData);
            setError(null);
        } catch (err: any) {
            console.error('[CareerDashboard Load Error]', err);
            setError(err.message || 'Failed to load career assessment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleRefreshCoach = async () => {
        await loadData(true);
    };

    if (loading) return <DashboardSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                <h2 className="text-xl font-bold text-foreground">Something Went Wrong</h2>
                <p className="text-muted-foreground max-w-md">{error}</p>
            </div>
        );
    }

    if (!careerData || !analyticsData || analyticsData.totalSessions === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl animate-bounce">📊</div>
                <h2 className="text-xl font-bold text-foreground">No Performance History Yet</h2>
                <p className="text-muted-foreground max-w-md">
                    Complete your first interview session to unlock your hiring readiness analysis, skill gaps breakdown, learning roadmaps, and AI career coach mentoring report.
                </p>
            </div>
        );
    }

    const isPro = user?.planType === 'PRO';

    return (
        <div className="container mx-auto px-4 py-6 sm:px-6 space-y-6 animate-fade-in relative">
            {/* Celebration Toast */}
            {showCelebration && (
                <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-400/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-white">🎉 Pro Activated!</h2>
                            <p className="text-white/80 text-sm mt-0.5">
                                Career Coaching, Personalized Roadmaps, and Skill Gap Analysis have been unlocked!
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCelebration(false)}
                        className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/30">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                        Career Development Platform
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Identify hiring readiness, map learning tracks, receive personal career coaching, and track historical growth.
                    </p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex bg-muted/60 border border-border/40 p-1.5 rounded-xl self-start shrink-0">
                    <button
                        onClick={() => setActiveTab('growth')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'growth' 
                                ? 'bg-card text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Target className="w-3.5 h-3.5" />
                        Readiness & Gaps
                    </button>
                    <button
                        onClick={() => setActiveTab('coaching')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'coaching' 
                                ? 'bg-card text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Compass className="w-3.5 h-3.5" />
                        Coach & Roadmap
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'history' 
                                ? 'bg-card text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Award className="w-3.5 h-3.5" />
                        Session History
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: 1. READINESS & GAPS */}
            {activeTab === 'growth' && (
                <div className="space-y-6">
                    {/* Hiring Readiness Card */}
                    <ReadinessMeter 
                        score={careerData.readinessScore} 
                        breakdown={careerData.readinessBreakdown} 
                        roleSuitability={careerData.roleSuitability} 
                        aiRecommendation={careerData.aiRecommendation} 
                    />

                    {/* Premium Profile Matching Widgets */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <MatchBreakdownCard
                            overallScore={careerData.overallMatchScore || careerData.readinessScore || 0}
                            resumeScore={careerData.resumeMatchScore || 0}
                            githubScore={careerData.githubMatchScore || 0}
                            detectedTechs={careerData.detectedTechnologies}
                            strongAreas={careerData.strongestAreas}
                            planType={user?.planType || 'FREE'}
                        />
                        <RecruiterRecommendationCard
                            recommendation={careerData.recruiterRecommendation?.recommendation || 'NO'}
                            reason={careerData.recruiterRecommendation?.reason || ''}
                            concerns={careerData.recruiterRecommendation?.concerns || []}
                            planType={user?.planType || 'FREE'}
                        />
                    </div>

                    {/* Verification Scores Card */}
                    <ValidationScoresCard
                        resumeValidation={careerData.resumeValidationScore || 0}
                        githubValidation={careerData.githubValidationScore || 0}
                        planType={user?.planType || 'FREE'}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Skill Gaps Breakdown */}
                        {isPro ? (
                            <SkillGapMatrix gaps={careerData.skillGap} insight={careerData.skillGapInsight} />
                        ) : (
                            <LockedSection featureLabel="Unlock Pro Skill Gaps Matrix">
                                <SkillGapMatrix gaps={careerData.skillGap} insight={careerData.skillGapInsight} />
                            </LockedSection>
                        )}

                        {/* Resume alignment Card */}
                        {isPro ? (
                            <ResumeAlignmentCard alignment={careerData.resumeAlignment} />
                        ) : (
                            <LockedSection featureLabel="Unlock Resume Claim Validation">
                                <ResumeAlignmentCard alignment={careerData.resumeAlignment} />
                            </LockedSection>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <RadarBreakdown 
                            skills={analyticsData.skills} 
                            strongestDimension={analyticsData.strongestDimension} 
                            weakestDimension={analyticsData.weakestDimension} 
                        />
                        {isPro ? (
                            <WeaknessInsights 
                                weaknessInsights={analyticsData.weaknessInsights} 
                                totalSessions={analyticsData.totalSessions} 
                            />
                        ) : (
                            <LockedSection featureLabel="Unlock Weakness Insights">
                                <WeaknessInsights 
                                    weaknessInsights={analyticsData.weaknessInsights} 
                                    totalSessions={analyticsData.totalSessions} 
                                />
                            </LockedSection>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. COACHING & ROADMAP */}
            {activeTab === 'coaching' && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* AI Coach panel */}
                        {isPro ? (
                            <AICoachPanel 
                                coachMessage={careerData.coachMessage} 
                                recommendations={careerData.coachRecommendations} 
                                onRefresh={handleRefreshCoach} 
                                planType={user?.planType || 'FREE'}
                            />
                        ) : (
                            <LockedSection featureLabel="Unlock Personal AI Coach">
                                <AICoachPanel 
                                    coachMessage={careerData.coachMessage} 
                                    recommendations={careerData.coachRecommendations} 
                                    onRefresh={handleRefreshCoach} 
                                    planType={user?.planType || 'FREE'}
                                />
                            </LockedSection>
                        )}

                        {/* Learning Roadmap */}
                        {isPro ? (
                            <RoadmapPlanner roadmap={careerData.roadmap} />
                        ) : (
                            <LockedSection featureLabel="Unlock Custom Study Roadmap">
                                <RoadmapPlanner roadmap={careerData.roadmap} />
                            </LockedSection>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. HISTORY & DETAILED METRICS */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <TrendChart data={analyticsData.performanceTrend} />
                        <TimeStats timeStats={analyticsData.timeStats} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {isPro ? (
                            <FocusStats focusStats={analyticsData.focusStats} />
                        ) : (
                            <LockedSection featureLabel="Unlock Focus Tracking Metrics">
                                <FocusStats focusStats={analyticsData.focusStats} />
                            </LockedSection>
                        )}

                        {analyticsData.sessionIntegrity && (
                            isPro ? (
                                <SessionIntegrity sessionIntegrity={analyticsData.sessionIntegrity} />
                            ) : (
                                <LockedSection featureLabel="Unlock Session Integrity Checks">
                                    <SessionIntegrity sessionIntegrity={analyticsData.sessionIntegrity} />
                                </LockedSection>
                            )
                        )}
                    </div>

                    {/* Complete History Table */}
                    <InterviewHistoryTable 
                        interviews={analyticsData.interviews} 
                        limitedHistory={analyticsData.limitedHistory} 
                    />
                </div>
            )}
        </div>
    );
}
