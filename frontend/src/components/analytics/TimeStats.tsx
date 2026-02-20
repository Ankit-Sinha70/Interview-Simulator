'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Zap, Timer, Gauge } from 'lucide-react';

interface TimeStatsProps {
    timeStats: {
        avgTimePerQuestion: number;
        fastestAnswer: number;
        slowestAnswer: number;
        efficiencyScore: number;
        perSession: { session: string; avgTime: number; score: number }[];
    };
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function TimeStats({ timeStats }: TimeStatsProps) {
    const statCards = [
        { label: 'Avg Time / Question', value: formatTime(timeStats.avgTimePerQuestion), icon: Clock, color: 'from-blue-500 to-cyan-500' },
        { label: 'Fastest Answer', value: formatTime(timeStats.fastestAnswer), icon: Zap, color: 'from-emerald-500 to-green-500' },
        { label: 'Slowest Answer', value: formatTime(timeStats.slowestAnswer), icon: Timer, color: 'from-orange-500 to-red-500' },
        { label: 'Efficiency Score', value: `${timeStats.efficiencyScore}/10`, icon: Gauge, color: 'from-violet-500 to-purple-500' },
    ];

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Time Analytics</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Response speed and efficiency</p>
            </div>
            <CardContent className="p-4 space-y-4">
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="group p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300"
                        >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="text-lg font-black text-white">{stat.value}</div>
                            <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Per-session bar chart */}
                {timeStats.perSession.length > 0 && (
                    <div className="h-[200px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeStats.perSession} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                                <XAxis dataKey="session" stroke="#bbb" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#bbb" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        borderRadius: '12px',
                                        border: '1px solid #444',
                                        color: 'white',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [`${formatTime(Number(value))}`, 'Avg Time']}
                                />
                                <Bar
                                    dataKey="avgTime"
                                    fill="#6c5ce7"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
