'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            getUserAnalytics(user._id).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
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
    // Backend returns sessions as array of { overallScore: number, date: Date, role: string }
    const recentScores = (analytics.sessions || []).map((session: any, i: number) => ({
        name: `S${i + 1}`,
        score: session.overallScore,
        date: new Date(session.date).toLocaleDateString(),
        role: session.role
    }));

    const skillsData = [
        { subject: 'Technical', A: analytics.averageTechnical, fullMark: 10 },
        { subject: 'Depth', A: analytics.averageDepth, fullMark: 10 },
        { subject: 'Clarity', A: analytics.averageClarity, fullMark: 10 },
        { subject: 'Problem Solving', A: analytics.averageProblemSolving, fullMark: 10 },
        { subject: 'Communication', A: analytics.averageCommunication, fullMark: 10 },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
                <p className="text-muted-foreground">Deep dive into your interview performance and progress.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
                    <CardHeader className="uppercase text-[10px] font-bold text-slate-300 tracking-widest pb-2">Average Score</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-4xl font-black text-white">{analytics.overallAverage}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">/ 10 Scale</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
                    <CardHeader className="uppercase text-[10px] font-bold text-slate-300 tracking-widest pb-2">Completed</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-4xl font-black text-white">{analytics.totalSessions}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total interviews</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
                    <CardHeader className="uppercase text-[10px] font-bold text-slate-300 tracking-widest pb-2">Strongest Area</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-xl font-bold text-emerald-400 truncate">{analytics.strongestDimension}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Top performing skill</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-all duration-300">
                    <CardHeader className="uppercase text-[10px] font-bold text-slate-300 tracking-widest pb-2">Improvement Area</CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-xl font-bold text-orange-400 truncate">{analytics.weakestDimension}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Focus on this area</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-4 py-2 border-b border-border/50 mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Skills Distribution</h3>
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">Real-time Map</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="100%" data={skillsData} className='text-white'>
                                <defs>
                                    <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00cec9" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#00cec9" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <PolarGrid stroke="#444" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 11, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} stroke="#444" />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#00cec9"
                                    fill="url(#radarFill)"
                                    fillOpacity={0.6}
                                    strokeWidth={3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid #444', backdropFilter: 'blur(8px)', color: 'white' }}
                                    itemStyle={{ color: 'white' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-4 py-2 border-b border-border/50 mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Recent Progress</h3>
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">Session History</span>
                    </div>
                    <CardContent className="h-[300px] p-0 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={recentScores} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#bbb"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    stroke="#bbb"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-5}
                                />
                                <Tooltip
                                    labelClassName="text-white font-bold mb-1"
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid #444', backdropFilter: 'blur(8px)', color: 'white' }}
                                    itemStyle={{ color: 'white' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6c5ce7"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#progressGradient)"
                                    dot={{ r: 5, fill: '#6c5ce7', strokeWidth: 2, stroke: '#000' }}
                                    activeDot={{ r: 7, strokeWidth: 0, fill: 'white' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
