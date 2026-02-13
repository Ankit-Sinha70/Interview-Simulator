'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FinalReport, AggregatedScores } from '@/services/api';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface ReportViewProps {
    report: FinalReport;
    scores: AggregatedScores;
    onNewSession: () => void;
}

export default function ReportView({ report, scores, onNewSession }: ReportViewProps) {
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

    return (
        <div className="max-w-[750px] mx-auto px-6 py-10">
            {/* Header */}
            <div className="animate-fadeInUp text-center mb-10">
                <div className="text-6xl mb-4">📋</div>
                <h1 className="text-3xl font-extrabold text-gradient-hero mb-2">Interview Report</h1>
                <p className="text-muted-foreground text-[15px]">Your comprehensive performance analysis</p>
            </div>

            {/* Overall Score + Hire Recommendation */}
            <Card className="animate-fadeInUp bg-card border-border shadow-lg text-center mb-6" style={{ animationDelay: '100ms' }}>
                <CardContent className="py-8 px-8">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] mb-3">
                        Overall Score
                    </div>
                    <div className={`text-7xl font-black bg-gradient-to-r ${scoreGradient} bg-clip-text text-transparent leading-none mb-4`}>
                        {report.averageScore}/10
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Badge className={`${confidenceColors[report.confidenceLevel]} text-[13px] font-bold px-5 py-1.5 border`}>
                            Confidence: {report.confidenceLevel}
                        </Badge>
                        <Badge className={`${hireColors[report.hireRecommendation]} text-[13px] font-bold px-5 py-1.5 border`}>
                            {hireEmoji[report.hireRecommendation]} Hire: {report.hireRecommendation}
                        </Badge>
                        {report.hireBand && (
                            <Badge className={`${report.hireBand === 'Strong Hire' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
                                report.hireBand === 'Hire' ? 'text-sky-400 bg-sky-500/15 border-sky-500/30' :
                                    report.hireBand === 'Borderline' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
                                        'text-red-400 bg-red-500/15 border-red-500/30'
                                } text-[13px] font-bold px-5 py-1.5 border`}>
                                {report.hireBand}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="animate-fadeInUp bg-card border-border shadow-lg mb-6" style={{ animationDelay: '150ms' }}>
                <CardHeader>
                    <CardTitle className="text-base font-bold text-center">🏆 Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
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

            {/* Strongest & Weakest Areas */}
            <div className="animate-fadeInUp grid grid-cols-2 gap-4 mb-6" style={{ animationDelay: '200ms' }}>
                <Card className="bg-card border-emerald-500/15">
                    <CardContent className="p-6">
                        <h3 className="text-emerald-400 text-[13px] font-bold uppercase tracking-wider mb-4">
                            🏆 Strongest Areas
                        </h3>
                        <div className="space-y-2">
                            {report.strongestAreas?.map((area, i) => (
                                <div key={i} className="bg-emerald-500/[0.08] rounded-lg px-3.5 py-2.5 text-muted-foreground text-[13px] font-medium flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> {area}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-red-500/15">
                    <CardContent className="p-6">
                        <h3 className="text-red-400 text-[13px] font-bold uppercase tracking-wider mb-4">
                            📌 Areas to Improve
                        </h3>
                        <div className="space-y-2">
                            {report.weakestAreas?.map((area, i) => (
                                <div key={i} className="bg-red-500/[0.08] rounded-lg px-3.5 py-2.5 text-muted-foreground text-[13px] font-medium flex items-center gap-2">
                                    <span className="text-red-400">!</span> {area}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Improvement Roadmap */}
            <Card className="animate-fadeInUp bg-card border-border shadow-lg mb-6" style={{ animationDelay: '300ms' }}>
                <CardHeader>
                    <CardTitle className="text-base font-bold">🗺️ Improvement Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                    {report.improvementRoadmap?.map((step, i) => (
                        <div key={i}>
                            <div className="flex gap-4 py-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent-violet)] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed pt-1">
                                    {step}
                                </p>
                            </div>
                            {i < report.improvementRoadmap.length - 1 && <Separator className="bg-border" />}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Next Preparation Focus */}
            {report.nextPreparationFocus && report.nextPreparationFocus.length > 0 && (
                <Card className="animate-fadeInUp bg-card border-[var(--accent-teal)]/15 shadow-lg mb-8" style={{ animationDelay: '400ms' }}>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">📚 What to Study Next</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            {report.nextPreparationFocus.map((focus, i) => (
                                <div key={i} className="bg-[var(--accent-teal)]/[0.06] rounded-lg px-3.5 py-2.5 text-muted-foreground text-[13px] font-medium flex items-center gap-2">
                                    <span className="text-[var(--accent-teal)]">→</span> {focus}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* New Session Button */}
            <div className="animate-fadeInUp" style={{ animationDelay: '500ms' }}>
                <Button
                    onClick={onNewSession}
                    size="lg"
                    className="w-full py-6 text-base font-bold bg-gradient-to-r from-[var(--accent-violet)] via-violet-400 to-[var(--accent-teal)] text-white hover:opacity-90 transition-all duration-300"
                >
                    🔄 Start New Interview
                </Button>
            </div>
        </div>
    );
}
