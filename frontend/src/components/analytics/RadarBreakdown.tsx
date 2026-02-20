'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RadarBreakdownProps {
    skills: {
        technical: number;
        depth: number;
        clarity: number;
        problemSolving: number;
        communication: number;
    };
    strongestDimension: string;
    weakestDimension: string;
}

export default function RadarBreakdown({ skills, strongestDimension, weakestDimension }: RadarBreakdownProps) {
    const radarData = [
        { subject: 'Technical', A: skills.technical, fullMark: 10 },
        { subject: 'Depth', A: skills.depth, fullMark: 10 },
        { subject: 'Clarity', A: skills.clarity, fullMark: 10 },
        { subject: 'Problem Solving', A: skills.problemSolving, fullMark: 10 },
        { subject: 'Communication', A: skills.communication, fullMark: 10 },
    ];

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Skill Breakdown</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">5-dimension competency radar</p>
            </div>
            <CardContent className="p-4">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <defs>
                                <linearGradient id="radarFillGrad" x1="0" y1="0" x2="0" y2="1">
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
                                fill="url(#radarFillGrad)"
                                fillOpacity={0.6}
                                strokeWidth={3}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid #444',
                                    color: 'white',
                                    fontSize: '12px',
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Strongest / Weakest callouts */}
                <div className="flex gap-3 mt-3">
                    <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Strongest
                        </div>
                        <div className="text-sm font-bold text-white">{strongestDimension}</div>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Weakest
                        </div>
                        <div className="text-sm font-bold text-white">{weakestDimension}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
