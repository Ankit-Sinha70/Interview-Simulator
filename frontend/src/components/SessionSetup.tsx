'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SessionSetupProps {
    onStart: (role: string, experienceLevel: 'Junior' | 'Mid' | 'Senior') => void;
    isLoading: boolean;
}

const ROLES = [
    { id: 'Frontend Developer', label: 'Frontend', icon: '🎨', desc: 'React, CSS, DOM, UX' },
    { id: 'Backend Developer', label: 'Backend', icon: '⚙️', desc: 'APIs, Databases, Architecture' },
    { id: 'Fullstack Developer', label: 'Fullstack', icon: '🔗', desc: 'End-to-End Development' },
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
        <div className="max-w-[700px] mx-auto px-6 py-10">
            {/* Header */}
            <div className="animate-fadeInUp text-center mb-12">
                <div className="text-5xl mb-4 animate-float">🎯</div>
                <h1 className="text-4xl font-extrabold text-gradient-hero mb-3 tracking-tight">
                    AI Interview Simulator
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed max-w-[480px] mx-auto">
                    Practice with an adaptive AI interviewer that adjusts questions based on your performance in real-time.
                </p>
            </div>

            {/* Role Selection */}
            <div className="animate-fadeInUp mb-9" style={{ animationDelay: '100ms' }}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-4">
                    Select Role
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {ROLES.map((r) => (
                        <Card
                            key={r.id}
                            onClick={() => setRole(r.id)}
                            className={`cursor-pointer transition-all duration-250 text-center hover:bg-accent/50 ${role === r.id
                                    ? 'border-[var(--accent-violet)] bg-accent shadow-[0_0_20px_var(--accent-violet-glow)]'
                                    : 'border-border bg-card'
                                }`}
                        >
                            <CardContent className="py-5 px-4">
                                <div className="text-3xl mb-2">{r.icon}</div>
                                <div className="text-card-foreground font-semibold text-sm">{r.label}</div>
                                <div className="text-muted-foreground text-[11px] mt-1">{r.desc}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Custom Role */}
                <Card
                    onClick={() => setRole('Custom')}
                    className={`mt-3 cursor-pointer transition-all duration-250 hover:bg-accent/50 ${role === 'Custom'
                            ? 'border-[var(--accent-violet)] bg-accent'
                            : 'border-border bg-card'
                        }`}
                >
                    <CardContent className="py-3.5 px-4 text-center">
                        <span className="text-muted-foreground text-[13px] font-medium">✏️ Custom Role</span>
                    </CardContent>
                </Card>

                {role === 'Custom' && (
                    <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g., DevOps Engineer, ML Engineer..."
                        className="mt-3 w-full px-4 py-3.5 bg-secondary border-2 border-border rounded-lg text-foreground text-sm outline-none font-[inherit] transition-colors focus:border-[var(--accent-violet)]"
                    />
                )}
            </div>

            {/* Level Selection */}
            <div className="animate-fadeInUp mb-10" style={{ animationDelay: '200ms' }}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-4">
                    Experience Level
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {LEVELS.map((l) => (
                        <Card
                            key={l.id}
                            onClick={() => setLevel(l.id)}
                            className={`cursor-pointer transition-all duration-250 text-center hover:bg-accent/50 ${level === l.id
                                    ? 'border-[var(--accent-teal)] bg-accent shadow-[0_0_20px_var(--accent-teal-glow)]'
                                    : 'border-border bg-card'
                                }`}
                        >
                            <CardContent className="py-5 px-4">
                                <div className="text-3xl mb-2">{l.icon}</div>
                                <div className="text-card-foreground font-semibold text-sm">{l.label}</div>
                                <div className="text-muted-foreground text-[11px] mt-1">{l.desc}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Start Button */}
            <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                <Button
                    onClick={() => canStart && level && onStart(selectedRole, level)}
                    disabled={!canStart || isLoading}
                    size="lg"
                    className={`w-full py-6 text-base font-bold tracking-wide transition-all duration-300 ${canStart
                            ? 'bg-gradient-to-r from-[var(--accent-violet)] via-violet-400 to-[var(--accent-teal)] text-white hover:opacity-90 animate-pulse-glow'
                            : 'bg-[var(--accent-violet)]/20 text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2.5">
                            <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            Generating your first question...
                        </span>
                    ) : (
                        '🚀 Start Interview'
                    )}
                </Button>
            </div>
        </div>
    );
}
