'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics } from '@/services/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            getUserAnalytics(user._id)
                .then(setAnalytics)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <div className="p-8 text-center bg-background min-h-screen">Loading analytics...</div>;

    if (!analytics || analytics.totalSessions === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl animate-bounce">📊</div>
                <h2 className="text-xl font-bold">No Analytics Data Yet</h2>
                <p className="text-muted-foreground max-w-md">
                    Complete your first interview to see detailed performance trends and AI-driven skill maps.
                </p>
            </div>
        );
    }

    // Transform data for charts
    // Backend returns recentTrend as array of numbers
    const recentScores = (analytics.recentTrend || []).map((score: number, i: number) => ({
        name: `S${i + 1}`,
        score: score,
    }));

    const skillsData = [
        { subject: 'Overall', A: analytics.averageScore, fullMark: 10 },
        // Fallback since backend doesn't provide granular averages yet
        { subject: 'Technical', A: analytics.averageScore, fullMark: 10 },
        { subject: 'Depth', A: analytics.averageScore, fullMark: 10 },
        { subject: 'Clarity', A: analytics.averageScore, fullMark: 10 },
        { subject: 'Soft Skills', A: analytics.averageScore, fullMark: 10 },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
                <p className="text-muted-foreground">Deep dive into your interview performance and progress.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest pb-2">Average Score</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-black">{analytics.averageScore}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">/ 10 Scale</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest pb-2">Completed</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-3xl font-black">{analytics.totalSessions}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total interviews</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest pb-2">Strongest</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-lg font-bold text-emerald-500 truncate">{analytics.strongestDimension}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Top performance area</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="uppercase text-[10px] font-bold text-muted-foreground tracking-widest pb-2">Weakest</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-lg font-bold text-red-500 truncate">{analytics.weakestDimension}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Focus improvement here</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                    <div className="px-4 py-2 border-b border-border/50 mb-4">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Skills Distribution</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                                <Radar name="Score" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                    <div className="px-4 py-2 border-b border-border/50 mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Recent Progress</h3>
                        {analytics.improvementRate !== null && (
                            <span className={analytics.improvementRate >= 0 ? "text-emerald-500 text-xs font-bold" : "text-amber-500 text-xs font-bold"}>
                                {analytics.improvementRate >= 0 ? '+' : ''}{analytics.improvementRate}% Growth
                            </span>
                        )}
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={recentScores}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 10]} stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
