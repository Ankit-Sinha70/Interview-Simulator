'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FinalReport, AggregatedScores, AttentionStats } from '@/services/api';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import LockedSection from './LockedSection';
import { ShieldCheck, BookOpen, Layers, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportViewProps {
    report: FinalReport;
    scores: AggregatedScores;
    onNewSession: () => void;
    onReplay?: () => void;
    attentionStats?: AttentionStats;
    isPro?: boolean;
}

export default function ReportView({ report, scores, onNewSession, onReplay, attentionStats, isPro = false }: ReportViewProps) {
    const router = useRouter();

    const confidenceColors: Record<string, string> = {
        High: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        Low: 'text-red-400 bg-red-500/15 border-red-500/30',
    };

    const hireColors: Record<string, string> = {
        Yes: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        Maybe: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        No: 'text-red-400 bg-red-500/15 border-red-500/30',
    };

    const hireEmoji: Record<string, string> = {
        Yes: '✅', Maybe: '🤔', No: '❌',
    };

    const scoreGradient = report.averageScore >= 7
        ? 'from-emerald-400 to-teal-400'
        : report.averageScore >= 4
            ? 'from-amber-400 to-orange-400'
            : 'from-red-400 to-rose-500';

    const radarData = [
        { subject: 'Technical', A: scores?.averageTechnical || 0, fullMark: 10 },
        { subject: 'Depth', A: scores?.averageDepth || 0, fullMark: 10 },
        { subject: 'Problem Solving', A: scores?.averageProblemSolving || 0, fullMark: 10 },
        { subject: 'Clarity', A: scores?.averageClarity || 0, fullMark: 10 },
        { subject: 'Communication', A: scores?.averageCommunication || 0, fullMark: 10 },
    ];

    // Helper to render locked overlay
    const renderGateOverlay = (title: string, desc: string) => (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-10 rounded-2xl">
            <Lock className="w-10 h-10 text-[var(--accent-teal)] mb-3 animate-pulse" />
            <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">{desc}</p>
            <Button 
                onClick={() => router.push('/pricing')}
                size="sm"
                className="bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] text-white font-bold rounded-xl"
            >
                Upgrade to PRO
            </Button>
        </div>
    );

    return (
        <div className="max-w-[1196px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-fadeInUp text-center">
                <div className="text-6xl mb-3">📋</div>
                <h1 className="text-3xl font-extrabold text-gradient-hero mb-1">Interview Report</h1>
                <p className="text-muted-foreground text-[14px]">Your comprehensive performance analysis</p>
            </div>

            {/* Overall Score + Hire Recommendation */}
            <Card className="animate-fadeInUp bg-card border-border shadow-lg text-center" style={{ animationDelay: '100ms' }}>
                <CardContent className="py-8 px-8 space-y-4">
                    <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-2">
                            Overall Score
                        </div>
                        <div className={`text-6xl font-black bg-gradient-to-r ${scoreGradient} bg-clip-text text-transparent leading-none`}>
                            {report.averageScore.toFixed(1)}/10
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Badge className={`${confidenceColors[report.confidenceLevel]} text-xs font-bold px-4 py-1 border`}>
                            Confidence: {report.confidenceLevel}
                        </Badge>
                        <Badge className={`${hireColors[report.hireRecommendation]} text-xs font-bold px-4 py-1 border`}>
                            {hireEmoji[report.hireRecommendation]} Hire: {report.hireRecommendation}
                        </Badge>
                        {report.hireBand && (
                            <Badge className={`${report.hireBand === 'Strong Hire' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
                                report.hireBand === 'Hire' ? 'text-sky-400 bg-sky-500/15 border-sky-500/30' :
                                report.hireBand === 'Borderline' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
                                'text-red-400 bg-red-500/15 border-red-500/30'
                                } text-xs font-bold px-4 py-1 border`}>
                                {report.hireBand}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Resume Alignment & Advanced Metrics */}
            {(report.resumeAlignmentScore !== undefined || report.interviewReadinessScore !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    
                    {/* Block A: Resume Alignment score (PRO locked) */}
                    <Card className="bg-card border-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                        <CardContent className="p-6 text-center space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resume Alignment Score</h3>
                            <div className="text-5xl font-black text-[var(--accent-teal)]">
                                {report.resumeAlignmentScore !== undefined ? `${report.resumeAlignmentScore}%` : 'N/A'}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Measures how your performance matched claimed skills on your resume.
                            </p>
                        </CardContent>
                        {!isPro && renderGateOverlay("Unlock Resume Alignment Score", "Compare resume credentials against performance insights.")}
                    </Card>

                    {/* Block B: Project Understanding (PRO locked) */}
                    <Card className="bg-card border-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                        <CardContent className="p-6 text-center space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Understanding</h3>
                            <div className="text-5xl font-black text-[var(--accent-violet)]">
                                {report.projectUnderstandingScore !== undefined ? `${report.projectUnderstandingScore}%` : 'N/A'}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Evaluates your depth in explaining projects listed on your profile.
                            </p>
                        </CardContent>
                        {!isPro && renderGateOverlay("Unlock Project Understanding Score", "Review project articulation and backend scenario validation.")}
                    </Card>

                    {/* Block C: Readiness Score (Unlocked) */}
                    <Card className="bg-card border-border flex flex-col justify-between min-h-[160px]">
                        <CardContent className="p-6 text-center space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Readiness</h3>
                            <div className="text-5xl font-black text-emerald-400">
                                {report.interviewReadinessScore !== undefined ? `${report.interviewReadinessScore}%` : 'N/A'}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Combined estimation of your preparedness for real technical interviews.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Skill Validation Matrix (Resume Claims vs Performance) */}
            {report.skillValidationMatrix && report.skillValidationMatrix.length > 0 && (
                <Card className="bg-card border-border relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[var(--accent-teal)]" /> Skill Validation Matrix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border/50 text-muted-foreground uppercase font-bold">
                                        <th className="py-3 px-4">Skill Claimed</th>
                                        <th className="py-3 px-4 text-center">Interview Score</th>
                                        <th className="py-3 px-4">Performance Insight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.skillValidationMatrix.map((item, idx) => {
                                        const scoreColor = item.performanceScore >= 7 
                                            ? 'text-emerald-400 bg-emerald-500/10' 
                                            : item.performanceScore >= 4 
                                                ? 'text-amber-400 bg-amber-500/10' 
                                                : 'text-red-400 bg-red-500/10';
                                        return (
                                            <tr key={idx} className="border-b border-border/30 hover:bg-background/20 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-foreground">{item.skill}</td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded-lg font-black ${scoreColor}`}>
                                                        {item.performanceScore}/10
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-muted-foreground leading-relaxed">{item.insight}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    {!isPro && renderGateOverlay("Unlock Complete Skill Gap Report", "Get detailed validation matrix for all resume claims vs interview performance.")}
                </Card>
            )}

            {/* Radar Chart & Attention Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Radar Chart */}
                <div>
                    {isPro ? (
                        <Card className="bg-card border-border shadow-lg h-full">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-center">🏆 Core Dimensions</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#374151" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                        <Radar
                                            name="Score"
                                            dataKey="A"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fill="#8b5cf6"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#a78bfa' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ) : (
                        <LockedSection featureLabel="Unlock Performance Breakdown Matrix">
                            <Card className="bg-card border-border shadow-lg h-full min-h-[300px] flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-center">🏆 Core Dimensions</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px] w-full flex items-center justify-center opacity-40">
                                    <div className="w-40 h-40 bg-violet-500/10 rounded-full border border-violet-500/20" />
                                </CardContent>
                            </Card>
                        </LockedSection>
                    )}
                </div>

                {/* Attention Stats */}
                {attentionStats && (
                    <div>
                        {isPro ? (
                            <Card className="bg-card border-border shadow-lg h-full">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-center">👀 Attention & Focus</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <div className="text-2xl font-bold text-blue-400">{attentionStats.focusScore}%</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Focus Score</div>
                                        </div>
                                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <div className="text-2xl font-bold text-blue-400">{attentionStats.totalLookAwayTime}s</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Look-away time</div>
                                        </div>
                                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <div className="text-2xl font-bold text-blue-400">{attentionStats.distractionEvents}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Distractions</div>
                                        </div>
                                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center">
                                            <Badge className={
                                                attentionStats.focusCategory === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                                                    attentionStats.focusCategory === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                                                        attentionStats.focusCategory === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                            }>
                                                {attentionStats.focusCategory}
                                            </Badge>
                                            <div className="text-[10px] text-muted-foreground mt-1 uppercase">Rating</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <LockedSection featureLabel="Unlock Engagement Monitoring Analysis">
                                <Card className="bg-card border-border shadow-lg h-full min-h-[300px] flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold text-center">👀 Attention & Focus</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 h-[200px]" />
                                </Card>
                            </LockedSection>
                        )}
                    </div>
                )}
            </div>

            {/* Time Pacing Analysis */}
            {report.timeAnalysis && (
                <div>
                    {isPro ? (
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-center">⏱️ Time Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-[var(--accent-violet)]/5 rounded-xl border border-[var(--accent-violet)]/10">
                                        <div className="text-2xl font-bold text-[var(--accent-violet)]">{report.timeAnalysis.averageTimePerQuestion}s</div>
                                        <div className="text-xs text-muted-foreground uppercase">Avg Time</div>
                                    </div>
                                    <div className="p-3 bg-[var(--accent-violet)]/5 rounded-xl border border-[var(--accent-violet)]/10">
                                        <div className="text-2xl font-bold text-[var(--accent-violet)]">{report.timeAnalysis.fastestAnswerTime}s</div>
                                        <div className="text-xs text-muted-foreground uppercase">Fastest</div>
                                    </div>
                                    <div className="p-3 bg-[var(--accent-violet)]/5 rounded-xl border border-[var(--accent-violet)]/10">
                                        <div className="text-2xl font-bold text-[var(--accent-violet)]">{report.timeAnalysis.slowestAnswerTime}s</div>
                                        <div className="text-xs text-muted-foreground uppercase">Slowest</div>
                                    </div>
                                    <div className="p-3 bg-[var(--accent-violet)]/5 rounded-xl border border-[var(--accent-violet)]/10">
                                        <div className="text-2xl font-bold text-[var(--accent-violet)]">{report.timeAnalysis.timeEfficiencyScore}/10</div>
                                        <div className="text-xs text-muted-foreground uppercase">Pacing Score</div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={report.timeAnalysis.charts || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.5} />
                                            <XAxis dataKey="questionIndex" stroke="#9CA3AF" fontSize={10} />
                                            <YAxis stroke="#9CA3AF" fontSize={10} />
                                            <Bar dataKey="timeSeconds" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <LockedSection featureLabel="Unlock Pacing and Response Speed Insights">
                            <Card className="bg-card border-border shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-center">⏱️ Time Efficiency</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px]" />
                            </Card>
                        </LockedSection>
                    )}
                </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-emerald-500/15">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            🏆 Strongest Dimensions
                        </h3>
                        <div className="space-y-2">
                            {report.strongestAreas?.map((area, i) => (
                                <div key={i} className="bg-emerald-500/[0.05] rounded-xl px-3.5 py-2.5 text-muted-foreground text-xs font-medium flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {area}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-red-500/15">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider">
                            📌 Improvement Areas
                        </h3>
                        <div className="space-y-2">
                            {report.weakestAreas?.map((area, i) => (
                                <div key={i} className="bg-red-500/[0.05] rounded-xl px-3.5 py-2.5 text-muted-foreground text-xs font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-400" /> {area}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommended Learning Path (Locked/Unlocked) */}
            {report.recommendedLearningPath && report.recommendedLearningPath.length > 0 && (
                <div className="relative">
                    <Card className="bg-card border-border overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[var(--accent-teal)]" /> Recommended Learning Path
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {report.recommendedLearningPath.map((path, i) => (
                                <div key={i} className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center gap-3 text-xs">
                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] flex items-center justify-center font-bold">
                                        {i + 1}
                                    </div>
                                    <div className="text-muted-foreground font-medium">{path}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    {!isPro && renderGateOverlay("Unlock Personalized Learning Roadmap", "Get step-by-step technical guidelines and resources based on your skill gaps.")}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {onReplay && (
                    <Button
                        onClick={onReplay}
                        size="lg"
                        variant="outline"
                        className="flex-1 py-6 text-sm font-bold bg-card border-border hover:bg-accent transition-all duration-300"
                    >
                        ▶ Replay Interview
                    </Button>
                )}
                <Button
                    onClick={onNewSession}
                    size="lg"
                    className="flex-1 py-6 text-sm font-bold bg-gradient-to-r from-[var(--accent-violet)] via-violet-400 to-[var(--accent-teal)] text-white hover:opacity-90 transition-all duration-300"
                >
                    🔄 Start New Interview
                </Button>
            </div>
        </div>
    );
}
