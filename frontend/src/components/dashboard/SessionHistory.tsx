'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Session {
    id: string; // _id from backend
    role: string;
    level: string;
    date: string;
    score: number;
    status: 'COMPLETED' | 'IN_PROGRESS';
}

interface HistoryProps {
    sessions: Session[];
}

export default function SessionHistory({ sessions }: HistoryProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sessions yet.</p>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{session.role}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1">{session.level}</Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(session.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`text-sm font-bold ${session.score >= 7 ? 'text-green-500' :
                                            session.score >= 5 ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                        {session.score > 0 ? session.score : '--'}
                                    </div>
                                    <Link href={session.status === 'COMPLETED' ? `/interview/report/${session.id}` : `/interview/session/${session.id}`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
