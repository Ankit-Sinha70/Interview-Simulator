'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) { // Ensure user ID is available locally mapped
            // In AuthContext user might have _id or userId depending on how it's saved.
            // Let's check AuthContext interface: interface User { _id: string; ... }
            getUserAnalytics(user._id).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
        }
    }, [user]);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
    if (!analytics) return <div className="p-8 text-center">No analytics data found. Complete an interview first!</div>;

    // Transform data for charts
    const recentScores = analytics.sessions.slice(-5).map((s: any, i: number) => ({
        name: `Session ${i + 1}`,
        score: s.overallScore,
        date: new Date(s.date).toLocaleDateString()
    }));

    const skillsData = [
        { subject: 'Technical', A: analytics.averageTechnical, fullMark: 10 },
        { subject: 'Depth', A: analytics.averageDepth, fullMark: 10 },
        { subject: 'Clarity', A: analytics.averageClarity, fullMark: 10 },
        { subject: 'Problem Solving', A: analytics.averageProblemSolving, fullMark: 10 },
        { subject: 'Communication', A: analytics.averageCommunication, fullMark: 10 },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold">Your Performance Analytics</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="uppercase text-xs font-bold text-muted-foreground">Overall Average</CardHeader>
                    <CardContent className="text-2xl font-bold">{analytics.overallAverage}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="uppercase text-xs font-bold text-muted-foreground">Total Sessions</CardHeader>
                    <CardContent className="text-2xl font-bold">{analytics.totalSessions}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="uppercase text-xs font-bold text-muted-foreground">Strongest Area</CardHeader>
                    <CardContent className="text-lg font-medium text-emerald-500">{analytics.strongestDimension}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="uppercase text-xs font-bold text-muted-foreground">Focus Area</CardHeader>
                    <CardContent className="text-lg font-medium text-amber-500">{analytics.weakestDimension}</CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-4">
                    <CardHeader><CardTitle>Skills Radar</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                                <Radar name="User" dataKey="A" stroke="var(--accent-violet)" fill="var(--accent-violet)" fillOpacity={0.5} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardHeader><CardTitle>Recent Progress</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={recentScores}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                                <Line type="monotone" dataKey="score" stroke="var(--accent-teal)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
