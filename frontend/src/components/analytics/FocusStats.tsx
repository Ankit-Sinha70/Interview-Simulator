'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, AlertTriangle, Shield } from 'lucide-react';

interface FocusStatsProps {
    focusStats: {
        avgFocusScore: number;
        avgDistractions: number;
        focusGrade: 'Green' | 'Yellow' | 'Red';
        focusTrend: { session: string; focusScore: number; date: string }[];
    };
}

export default function FocusStats({ focusStats }: FocusStatsProps) {
    const gradeConfig = {
        Green: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Excellent', icon: Shield },
        Yellow: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Moderate', icon: Eye },
        Red: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Needs Work', icon: AlertTriangle },
    };

    const grade = gradeConfig[focusStats.focusGrade];
    const GradeIcon = grade.icon;
    const chartColor = focusStats.focusGrade === 'Green' ? '#00cec9' : focusStats.focusGrade === 'Yellow' ? '#fdcb6e' : '#e17055';

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Focus & Attention</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Eye tracking and distraction analysis</p>
            </div>
            <CardContent className="p-4 space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                        <div className="text-2xl font-black text-white">{focusStats.avgFocusScore}%</div>
                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Avg Focus</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                        <div className="text-2xl font-black text-white">{focusStats.avgDistractions}</div>
                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Distractions</div>
                    </div>
                    <div className={`p-4 rounded-xl ${grade.bg} border ${grade.border} text-center`}>
                        <div className={`flex items-center justify-center gap-1.5 ${grade.color}`}>
                            <GradeIcon className="w-5 h-5" />
                            <span className="text-lg font-black">{grade.label}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Grade</div>
                    </div>
                </div>

                {/* Focus trend chart */}
                {focusStats.focusTrend.length > 0 && (
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={focusStats.focusTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                                <XAxis dataKey="session" stroke="#bbb" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} stroke="#bbb" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                        borderRadius: '12px',
                                        border: '1px solid #444',
                                        color: 'white',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [`${value}%`, 'Focus']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="focusScore"
                                    stroke={chartColor}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#focusGradient)"
                                    dot={{ r: 4, fill: chartColor, strokeWidth: 2, stroke: '#1a1a2e' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
