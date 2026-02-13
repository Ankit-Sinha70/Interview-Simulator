'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Award, Target, TrendingUp } from 'lucide-react';

interface StatsProps {
    totalSessions: number;
    averageScore: number;
    weakestDimension: string;
    improvementRate: number | null;
}

export default function DashboardStats({ totalSessions, averageScore, weakestDimension, improvementRate }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSessions}</div>
                    <p className="text-xs text-muted-foreground">Lifetime sessions</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageScore}/10</div>
                    <p className="text-xs text-muted-foreground">Across all interviews</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Focus Area</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate text-red-500">{weakestDimension}</div>
                    <p className="text-xs text-muted-foreground">Most frequent weakness</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${improvementRate && improvementRate > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {improvementRate ? `+${improvementRate}%` : '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">Since first session</p>
                </CardContent>
            </Card>
        </div>
    );
}
