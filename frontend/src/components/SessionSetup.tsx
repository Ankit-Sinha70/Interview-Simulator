'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SessionSetupProps {
    onStart: (
        role: string, 
        experienceLevel: 'Junior' | 'Mid' | 'Senior',
        interviewStyle: 'friendly' | 'strict' | 'faang',
        companyStyle: 'google' | 'startup' | 'product' | 'general',
        resume?: File | null,
        useResumeFlag?: boolean
    ) => void;
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

const INTERVIEW_STYLES = [
    { id: 'friendly' as const, label: 'Friendly', icon: '😊', desc: 'Guiding & supportive' },
    { id: 'strict' as const, label: 'Strict', icon: '🧐', desc: 'Professional & rigorous' },
    { id: 'faang' as const, label: 'FAANG', icon: '🏢', desc: 'Extremely demanding' },
];

const COMPANY_STYLES = [
    { id: 'general' as const, label: 'General', icon: '🌍', desc: 'Balanced approach' },
    { id: 'startup' as const, label: 'Startup', icon: '🦄', desc: 'Practical, fast-paced' },
    { id: 'google' as const, label: 'Google-style', icon: '🧠', desc: 'Deep & algorithmic' },
    { id: 'product' as const, label: 'Product-focused', icon: '🎨', desc: 'User-centric impact' },
];

export default function SessionSetup({ onStart, isLoading }: SessionSetupProps) {
    const [role, setRole] = useState('');
    const [level, setLevel] = useState<'Junior' | 'Mid' | 'Senior' | ''>('');
    const [customRole, setCustomRole] = useState('');
    const [interviewStyle, setInterviewStyle] = useState<'friendly' | 'strict' | 'faang'>('friendly');
    const [companyStyle, setCompanyStyle] = useState<'google' | 'startup' | 'product' | 'general'>('general');
    const [resume, setResume] = useState<File | null>(null);

    const { user } = useAuth();
    const [useResume, setUseResume] = useState<boolean>(!!user?.parsedResume);

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

                    {/* Interview Style Selection */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                            Interviewer Persona
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {INTERVIEW_STYLES.map((s) => (
                                <Card
                                    key={s.id}
                                    onClick={() => setInterviewStyle(s.id)}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${interviewStyle === s.id
                                        ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 ring-2 ring-[var(--accent-violet)]/30'
                                        : 'border-transparent bg-background/50 hover:bg-background/80'
                                        }`}
                                >
                                    <CardContent className="p-4 text-center sm:text-left flex sm:block flex-col items-center">
                                        <div className="text-2xl mb-2">{s.icon}</div>
                                        <div className="font-bold text-foreground text-sm">{s.label}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Company Style Selection */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                            Company Focus
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {COMPANY_STYLES.map((c) => (
                                <Card
                                    key={c.id}
                                    onClick={() => setCompanyStyle(c.id)}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${companyStyle === c.id
                                        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 ring-2 ring-[var(--accent-teal)]/30'
                                        : 'border-transparent bg-background/50 hover:bg-background/80'
                                        }`}
                                >
                                    <CardContent className="p-4 text-center sm:text-left flex sm:block flex-col items-center">
                                        <div className="text-2xl mb-2">{c.icon}</div>
                                        <div className="font-bold text-foreground text-sm">{c.label}</div>
                                        <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{c.desc}</div>
                                    </CardContent>
                                </Card>
                            ))}
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

                    {/* Resume Upload (Optional) */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                            Resume Context {user?.parsedResume ? '(Active)' : '(Optional)'}
                        </h2>
                        
                        {user?.parsedResume && !resume && (
                            <div className="flex items-center justify-between p-4 border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/5 rounded-xl mb-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Structured Resume Found</p>
                                        <p className="text-xs text-muted-foreground">{user.parsedResume.skills?.length || 0} skills, {user.parsedResume.experience?.length || 0} roles extracted</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={useResume} onChange={() => setUseResume(!useResume)} />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        )}

                        <div className={`flex flex-col items-center justify-center border-2 border-dashed ${resume ? 'border-emerald-400/50 bg-emerald-400/5' : 'border-border/60 bg-background/30 hover:bg-background/50'} rounded-xl p-6 transition-colors`}>
                            <input 
                                type="file" 
                                accept=".pdf,.txt" 
                                id="resume-upload" 
                                className="hidden" 
                                onChange={(e) => setResume(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2 text-center w-full">
                                <FileText className={`w-8 h-8 ${resume ? 'text-emerald-400' : 'text-[var(--accent-teal)]'}`} />
                                <span className="text-sm font-semibold max-w-[250px] truncate text-white">
                                    {resume ? resume.name : (user?.parsedResume ? 'Upload a new resume to replace' : 'Click to upload your resume (PDF/TXT)')}
                                </span>
                                {!resume && !user?.parsedResume && <span className="text-xs text-muted-foreground">Tailor your interview strictly to your background</span>}
                            </label>
                            {resume && (
                                <button className="text-xs text-red-400 mt-2 hover:underline" onClick={() => setResume(null)}>Remove File</button>
                            )}
                        </div>
                    </div>

                    {/* Start Button */}
                    <div className="pt-4">
                        <Button
                            onClick={() => canStart && level && onStart(selectedRole, level, interviewStyle, companyStyle, resume, useResume)}
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
