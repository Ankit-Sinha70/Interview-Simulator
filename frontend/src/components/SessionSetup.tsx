'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SessionSetupProps {
    onStart: (role: string, experienceLevel: 'Junior' | 'Mid' | 'Senior') => void;
    isLoading: boolean;
}

const ROLES = [
    { id: 'Frontend Developer', label: 'Frontend', icon: '🎨', desc: 'React, CSS, DOM' },
    { id: 'Backend Developer', label: 'Backend', icon: '⚙️', desc: 'APIs, DBs, Auth' },
    { id: 'Fullstack Developer', label: 'Fullstack', icon: '🔗', desc: 'End-to-End Dev' },
];

const LEVELS = [
    { id: 'Junior' as const, label: 'Junior', icon: '🌱', desc: '0-2 years' },
    { id: 'Mid' as const, label: 'Mid', icon: '🚀', desc: '2-5 years' },
    { id: 'Senior' as const, label: 'Senior', icon: '⭐', desc: '5+ years' },
];

export default function SessionSetup({ onStart, isLoading }: SessionSetupProps) {
    const [role, setRole] = useState('');
    const [level, setLevel] = useState<'Junior' | 'Mid' | 'Senior' | ''>('');
    const [customRole, setCustomRole] = useState('');

    const selectedRole = role === 'Custom' ? customRole : role;
    const canStart = selectedRole.trim() && level;

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] w-full px-4 sm:px-6">
            <div className="w-full max-w-6xl space-y-8 animate-fade-in-up">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-2 animate-float">
                        <span className="text-4xl">🎯</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        <span className="text-gradient-hero">AI Interview Simulator</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        Master your tech interview skills with an adaptive AI that challenges you in real-time.
                    </p>
                </div>

                <div className="grid gap-8 p-6 sm:p-8 rounded-3xl bg-secondary/30 border border-border/50 backdrop-blur-sm shadow-xl">

                    {/* Role Selection */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                            Select Role
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {ROLES.map((r) => (
                                <Card
                                    key={r.id}
                                    onClick={() => setRole(r.id)}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${role === r.id
                                        ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 ring-2 ring-[var(--accent-violet)]/30'
                                        : 'border-transparent bg-background/50 hover:bg-background/80'
                                        }`}
                                >
                                    <CardContent className="p-5 text-center sm:text-left flex sm:block flex-col items-center">
                                        <div className="text-3xl mb-3">{r.icon}</div>
                                        <div className="font-bold text-foreground">{r.label}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Custom Role Input */}
                        <div className={`transition-all duration-300 overflow-hidden ${role === 'Custom' ? 'h-auto opacity-100' : 'h-12 opacity-70'}`}>
                            {role !== 'Custom' ? (
                                <button
                                    onClick={() => setRole('Custom')}
                                    className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-xl hover:bg-muted/30"
                                >
                                    + Enter Custom Role
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-[var(--accent-violet)]">Custom Role</span>
                                        <button onClick={() => setRole('')} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                                    </div>
                                    <input
                                        type="text"
                                        value={customRole}
                                        onChange={(e) => setCustomRole(e.target.value)}
                                        placeholder="e.g. DevOps Engineer, iOS Developer..."
                                        autoFocus
                                        className="w-full px-4 py-3 rounded-xl bg-background border-2 border-[var(--accent-violet)] focus:ring-4 focus:ring-[var(--accent-violet)]/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level Selection */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                            Experience Level
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {LEVELS.map((l) => (
                                <Card
                                    key={l.id}
                                    onClick={() => setLevel(l.id)}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${level === l.id
                                        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 ring-2 ring-[var(--accent-teal)]/30'
                                        : 'border-transparent bg-background/50 hover:bg-background/80'
                                        }`}
                                >
                                    <CardContent className="p-5 text-center sm:text-left flex sm:block flex-col items-center">
                                        <div className="text-3xl mb-3">{l.icon}</div>
                                        <div className="font-bold text-foreground">{l.label}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{l.desc}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <div className="pt-4">
                        <Button
                            onClick={() => canStart && level && onStart(selectedRole, level)}
                            disabled={!canStart || isLoading}
                            size="lg"
                            className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${canStart
                                ? 'bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] hover:scale-[1.01]'
                                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-3">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating Interview...
                                </span>
                            ) : (
                                '🚀 Start Interview Session'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
