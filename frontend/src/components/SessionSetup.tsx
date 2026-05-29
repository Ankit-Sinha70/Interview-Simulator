'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText, CheckCircle2, Code, Server, Layers, Leaf, Rocket,
    Star, Smile, UserCheck, Briefcase, Globe, Zap, Brain, Target,
    Plus, X, UploadCloud, AlertCircle, RefreshCw, ArrowLeft, ShieldAlert, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadResume, updateResumeData, evaluateATS } from '@/services/api';
import { toast } from 'sonner';

interface SessionSetupProps {
    onStart: (
        role: string,
        experienceLevel: 'Junior' | 'Mid' | 'Senior',
        interviewStyle: 'friendly' | 'strict' | 'faang',
        companyStyle: 'google' | 'startup' | 'product' | 'general',
        useResumeFlag?: boolean
    ) => void;
    isLoading: boolean;
}

const ROLES = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'React Developer',
    'Node.js Developer',
    'Angular Developer',
    'DevOps Engineer',
    'QA Engineer'
];

const SUGGESTED_SKILLS = [
    'React', 'Next.js', 'Redux', 'TypeScript', 'JavaScript',
    'Node.js', 'Express', 'NestJS', 'MongoDB', 'PostgreSQL',
    'Docker', 'Kubernetes', 'AWS', 'System Design', 'Git',
    'Python', 'Go', 'Java', 'GraphQL', 'TailwindCSS'
];

export default function SessionSetup({ onStart, isLoading }: SessionSetupProps) {
    const { user, refreshUser } = useAuth();

    // Step state: 'choose_type' | 'manual_setup' | 'resume_upload' | 'resume_review'
    const [step, setStep] = useState<'choose_type' | 'manual_setup' | 'resume_upload' | 'resume_review'>('choose_type');

    // --- ATS & COMPANY SPECIFIC STATE ---
    const [jobDescription, setJobDescription] = useState(user?.targetJobDescription?.rawText || '');
    const [targetCompany, setTargetCompany] = useState(user?.targetJobDescription?.company || 'General');
    const [customCompany, setCustomCompany] = useState('');
    const [atsLoading, setAtsLoading] = useState(false);
    const [atsResult, setAtsResult] = useState<{
        score: number;
        matchedSkills: string[];
        missingSkills: string[];
        suggestions: string[];
    } | null>(user?.atsScore ? {
        score: user.atsScore.score,
        matchedSkills: user.atsScore.matchedSkills,
        missingSkills: user.atsScore.missingSkills,
        suggestions: user.atsScore.suggestions
    } : null);

    const getCompanyStyleForStart = (co: string) => {
        const lower = co.toLowerCase();
        if (lower.includes('google')) return 'google';
        if (lower.includes('startup')) return 'startup';
        if (lower.includes('product') || lower.includes('netflix') || lower.includes('stripe') || lower.includes('apple') || lower.includes('meta') || lower.includes('amazon') || lower.includes('microsoft')) return 'product';
        return 'general';
    };

    const handleAtsEvaluate = async () => {
        if (!jobDescription.trim()) {
            return toast.error('Please enter a Job Description to evaluate');
        }
        setAtsLoading(true);
        try {
            const role = step === 'manual_setup'
                ? (manualRole === 'Custom' ? customManualRole : manualRole)
                : detectedRole;
            const companyName = targetCompany === 'Custom' ? customCompany : targetCompany;
            const res = await evaluateATS(jobDescription.trim(), role, companyName);
            if (res && res.atsScore) {
                setAtsResult(res.atsScore);
                toast.success(`ATS Evaluation Complete! Match Score: ${res.atsScore.score}%`);
                await refreshUser();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to analyze Job Description');
        } finally {
            setAtsLoading(false);
        }
    };

    const renderJobDescriptionSection = () => {
        return (
            <div className="p-5 rounded-2xl bg-background/40 border border-border/40 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-violet-400" />
                        Target Job Description & ATS Analysis
                    </h3>
                    <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/20 bg-violet-500/5">
                        Match Optimization
                    </Badge>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Target Company</label>
                    <div className="flex flex-wrap gap-1.5">
                        {['General', 'Google', 'Meta', 'Netflix', 'Amazon', 'Stripe', 'Startup', 'Custom'].map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => { setTargetCompany(c); if (c !== 'Custom') setCustomCompany(''); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${targetCompany === c
                                        ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] dark:border-violet-500/50 dark:bg-violet-950/30 dark:text-violet-300'
                                        : 'border-border/50 bg-background/20 text-muted-foreground hover:bg-background/80'
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {targetCompany === 'Custom' && (
                        <input
                            type="text"
                            value={customCompany}
                            onChange={(e) => setCustomCompany(e.target.value)}
                            placeholder="Enter custom company (e.g. OpenAI, Apple)..."
                            className="w-full mt-2 px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-violet-500 text-xs"
                        />
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Job Description Text</label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste Job Description here to get real-time ATS match rating & optimize questions..."
                        rows={4}
                        className="w-full p-3 rounded-xl bg-background border border-border focus:outline-none focus:border-violet-500 text-xs font-medium"
                    />
                </div>

                <Button
                    type="button"
                    variant="default"
                    disabled={atsLoading || !jobDescription.trim()}
                    onClick={handleAtsEvaluate}
                    className="w-full font-semibold rounded-xl text-xs py-2 h-9 flex items-center justify-center gap-1.5"
                >
                    {atsLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing Match...</>
                    ) : (
                        <><RefreshCw className="w-3.5 h-3.5" /> Evaluate Profile Match</>
                    )}
                </Button>

                {atsResult && (
                    <div className="mt-4 p-4 rounded-xl border border-border/40 bg-muted/10 space-y-4 text-left">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-violet-500/30 bg-violet-500/10">
                                <span className="text-xs font-black text-violet-600 dark:text-violet-400">{atsResult.score}%</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold">ATS Alignment Match</h4>
                                <p className="text-[10px] text-muted-foreground">Calculated matching ratio relative to target profile & GitHub activity</p>
                            </div>
                        </div>

                        {atsResult.matchedSkills.length > 0 && (
                            <div>
                                <h5 className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Matched Keywords</h5>
                                <div className="flex flex-wrap gap-1">
                                    {atsResult.matchedSkills.map(s => (
                                        <span key={s} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {atsResult.missingSkills.length > 0 && (
                            <div>
                                <h5 className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">Missing Gaps</h5>
                                <div className="flex flex-wrap gap-1">
                                    {atsResult.missingSkills.map(s => (
                                        <span key={s} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {atsResult.suggestions.length > 0 && (
                            <div>
                                <h5 className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1.5">Optimization Checklist</h5>
                                <ul className="list-disc pl-4 space-y-1 text-[10px] text-muted-foreground leading-relaxed">
                                    {atsResult.suggestions.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Loading state for upload & parse
    const [isParsing, setIsParsing] = useState(false);

    // --- MANUAL SETUP STATE ---
    const [manualRole, setManualRole] = useState('Frontend Developer');
    const [customManualRole, setCustomManualRole] = useState('');
    const [manualLevel, setManualLevel] = useState<'Junior' | 'Mid' | 'Senior'>('Mid');
    const [manualSkills, setManualSkills] = useState<string[]>(['React', 'TypeScript', 'JavaScript']);
    const [skillInput, setSkillInput] = useState('');
    const [manualDifficulty, setManualDifficulty] = useState<'friendly' | 'strict' | 'faang'>('friendly');
    const [manualFocus, setManualFocus] = useState<'google' | 'startup' | 'product' | 'general'>('general');

    // --- RESUME-BASED STATE (for editing) ---
    const [detectedRole, setDetectedRole] = useState('');
    const [detectedExperience, setDetectedExperience] = useState('3 Years');
    const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
    const [detectedProjects, setDetectedProjects] = useState<Array<{ name: string; description: string; techStack: string[] }>>([]);
    const [newResumeSkill, setNewResumeSkill] = useState('');

    // File upload state
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    // Handle initial resume detection loading
    const enterReviewScreen = (parsedData: any) => {
        setDetectedRole(parsedData.role || parsedData.rolePreference || 'Software Developer');
        setDetectedExperience(parsedData.experienceYears || '2-3 Years');

        // Combine skills and technologies
        const skillsSet = new Set<string>();
        if (Array.isArray(parsedData.skills)) parsedData.skills.forEach((s: any) => skillsSet.add(String(s)));
        if (Array.isArray(parsedData.technologies)) parsedData.technologies.forEach((t: any) => skillsSet.add(String(t)));
        setDetectedSkills(Array.from(skillsSet));

        setDetectedProjects(parsedData.projects || []);
        setStep('resume_review');
    };

    // Triggered review screen load from context if already exists
    const loadExistingResumeReview = () => {
        if (user?.parsedResume) {
            enterReviewScreen(user.parsedResume);
        } else {
            setStep('resume_upload');
        }
    };

    // File selection / drop handler
    const handleFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are supported');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds the 5 MB limit');
            return;
        }

        setIsParsing(true);
        setUploadProgress(20);

        try {
            const formData = new FormData();
            formData.append('resume', file);

            setUploadProgress(50);
            const res = await uploadResume(formData);

            setUploadProgress(80);
            await refreshUser(); // sync context

            toast.success('Resume analyzed successfully');
            setUploadProgress(100);

            // Get user data directly after refresh
            const updatedUserRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (updatedUserRes.ok) {
                const userJson = await updatedUserRes.json();
                enterReviewScreen(userJson.data.parsedResume);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to upload and parse resume');
        } finally {
            setIsParsing(false);
            setUploadProgress(0);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Manual setup tag manipulators
    const addManualSkill = (skill: string) => {
        const trimmed = skill.trim();
        if (trimmed && !manualSkills.includes(trimmed)) {
            setManualSkills([...manualSkills, trimmed]);
        }
        setSkillInput('');
    };

    const removeManualSkill = (skill: string) => {
        setManualSkills(manualSkills.filter(s => s !== skill));
    };

    // Resume tag manipulators
    const addResumeSkill = (skill: string) => {
        const trimmed = skill.trim();
        if (trimmed && !detectedSkills.includes(trimmed)) {
            setDetectedSkills([...detectedSkills, trimmed]);
        }
        setNewResumeSkill('');
    };

    const removeResumeSkill = (skill: string) => {
        setDetectedSkills(detectedSkills.filter(s => s !== skill));
    };

    // Launch Manual Interview
    const startManualInterview = () => {
        const finalRole = manualRole === 'Custom' ? customManualRole : manualRole;
        if (!finalRole.trim()) {
            toast.error('Please specify a job role');
            return;
        }
        onStart(
            finalRole,
            manualLevel,
            manualDifficulty,
            getCompanyStyleForStart(targetCompany === 'Custom' ? customCompany : targetCompany),
            false
        );
    };

    // Launch Resume Interview
    const startResumeInterview = async () => {
        setIsParsing(true);
        try {
            // Save modified parameters to user profile first
            await updateResumeData({
                role: detectedRole,
                experienceYears: detectedExperience,
                skills: detectedSkills,
                projects: detectedProjects
            });

            await refreshUser();

            // Map experience to nearest enum level for validation engine
            let nearestLevel: 'Junior' | 'Mid' | 'Senior' = 'Mid';
            const expLower = detectedExperience.toLowerCase();
            if (expLower.includes('junior') || expLower.includes('0-2') || expLower.includes('1 year') || expLower.includes('0 year')) {
                nearestLevel = 'Junior';
            } else if (expLower.includes('senior') || expLower.includes('5+') || expLower.includes('5 year') || expLower.includes('8 year') || expLower.includes('10 year')) {
                nearestLevel = 'Senior';
            }

            onStart(
                detectedRole,
                nearestLevel,
                'friendly',
                getCompanyStyleForStart(targetCompany === 'Custom' ? customCompany : targetCompany),
                true
            );
        } catch (err: any) {
            toast.error('Failed to update resume preferences before starting');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in-up">

            {/* Step 1: Choose Interview Type */}
            {step === 'choose_type' && (
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--accent-violet)]/20 to-[var(--accent-teal)]/20 border border-[var(--accent-violet)]/30 mb-2">
                            <span className="text-xs font-semibold tracking-wider text-[var(--accent-teal)] uppercase">Mode Selection</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                            Choose Your <span className="text-gradient-hero">Interview Setup</span>
                        </h1>
                        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                            Select manual configuration or let AI tailor the entire experience to your resume.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">

                        {/* Option 1: Manual Setup */}
                        <Card
                            onClick={() => setStep('manual_setup')}
                            className="group cursor-pointer border-2 border-border/50 bg-background/50 hover:bg-background/80 hover:border-[var(--accent-violet)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,92,231,0.15)] flex flex-col justify-between"
                        >
                            <CardContent className="p-8 space-y-6">
                                <div className="p-4 rounded-2xl bg-[var(--accent-violet)]/10 w-fit group-hover:scale-110 transition-transform duration-300">
                                    <Code className="w-10 h-10 text-[var(--accent-violet)]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground group-hover:text-[var(--accent-violet)] transition-colors">
                                        Manual Setup
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Configure your interview from scratch. Specify your role, experience level, primary tech stack, and difficulty preferences.
                                    </p>
                                </div>
                                <div className="pt-2 text-xs font-semibold text-[var(--accent-violet)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Configure Manually &rarr;
                                </div>
                            </CardContent>
                        </Card>

                        {/* Option 2: Resume-Based Setup */}
                        <Card
                            onClick={loadExistingResumeReview}
                            className="group cursor-pointer border-2 border-border/50 bg-background/50 hover:bg-background/80 hover:border-[var(--accent-teal)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(45,210,188,0.15)] flex flex-col justify-between"
                        >
                            <CardContent className="p-8 space-y-6">
                                <div className="p-4 rounded-2xl bg-[var(--accent-teal)]/10 w-fit group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-10 h-10 text-[var(--accent-teal)]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground group-hover:text-[var(--accent-teal)] transition-colors">
                                        Resume-Based Setup
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Upload your resume (PDF). AI will analyze your work history, projects, and tech stack to generate a custom conversational interview.
                                    </p>
                                </div>
                                <div className="pt-2 text-xs font-semibold text-[var(--accent-teal)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    {user?.parsedResume ? 'Review Existing Resume \u2192' : 'Upload Resume \u2192'}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}

            {/* Step 2: Manual Setup Form */}
            {step === 'manual_setup' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <button
                            onClick={() => setStep('choose_type')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-2xl font-bold text-foreground">Manual Setup</h2>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    <div className="p-6 sm:p-8 rounded-3xl bg-secondary/20 border border-border/50 backdrop-blur-md space-y-6">

                        {/* Job Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Select Job Role</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROLES.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => { setManualRole(r); setCustomManualRole(''); }}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${manualRole === r
                                                ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] ring-1 ring-[var(--accent-violet)]/30'
                                                : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-background/80 hover:text-foreground'
                                            }`}
                                    >
                                        {r.replace(' Developer', '').replace(' Engineer', '')}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setManualRole('Custom')}
                                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${manualRole === 'Custom'
                                            ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                                            : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-background/80'
                                        }`}
                                >
                                    + Custom Role
                                </button>
                            </div>

                            {manualRole === 'Custom' && (
                                <input
                                    type="text"
                                    value={customManualRole}
                                    onChange={(e) => setCustomManualRole(e.target.value)}
                                    placeholder="Enter custom role title..."
                                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-background border border-border focus:border-[var(--accent-violet)] focus:outline-none text-sm"
                                />
                            )}
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Experience Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { id: 'Junior', label: 'Junior', sub: '0-2 years' },
                                    { id: 'Mid', label: 'Mid-Level', sub: '2-5 years' },
                                    { id: 'Senior', label: 'Senior', sub: '5+ years' }
                                ] as const).map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => setManualLevel(l.id)}
                                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${manualLevel === l.id
                                                ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] ring-1 ring-[var(--accent-teal)]/30'
                                                : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-background/80'
                                            }`}
                                    >
                                        <span className="text-sm font-bold">{l.label}</span>
                                        <span className="text-[10px] opacity-70">{l.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skills Selection (Tags) */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Skills / Technologies (Primary Stack)</label>

                            {/* Tags list */}
                            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-background/40 border border-border/40 min-h-[50px]">
                                {manualSkills.length === 0 ? (
                                    <span className="text-xs text-muted-foreground self-center">No skills added yet. Click suggestions below or type custom.</span>
                                ) : (
                                    manualSkills.map(skill => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/30 text-[var(--accent-violet)]"
                                        >
                                            {skill}
                                            <button onClick={() => removeManualSkill(skill)} className="hover:text-red-400">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>

                            {/* Text Input to add skill */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualSkill(skillInput))}
                                    placeholder="Type a skill and press enter..."
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border focus:border-[var(--accent-violet)] focus:outline-none text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={() => addManualSkill(skillInput)}
                                    className="bg-muted hover:bg-muted/80 text-foreground px-4 rounded-xl"
                                >
                                    Add
                                </Button>
                            </div>

                            {/* Popular Suggestions */}
                            <div className="space-y-1.5 pt-2">
                                <span className="text-[11px] font-medium text-muted-foreground">Suggested Skills:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {SUGGESTED_SKILLS.filter(s => !manualSkills.includes(s)).slice(0, 10).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => addManualSkill(s)}
                                            className="px-2.5 py-1 rounded-lg text-[10px] bg-background/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-muted transition-all"
                                        >
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interview Style / Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Interviewer Persona</label>
                                <select
                                    value={manualDifficulty}
                                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-sm"
                                >
                                    <option value="friendly">Friendly (Supportive & guiding)</option>
                                    <option value="strict">Strict (Professional & rigorous)</option>
                                    <option value="faang">FAANG style (Extremely challenging)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Company Environment Focus</label>
                                <select
                                    value={manualFocus}
                                    onChange={(e) => setManualFocus(e.target.value as any)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-sm"
                                >
                                    <option value="general">General Balanced</option>
                                    <option value="startup">Startup Focus (High velocity & range)</option>
                                    <option value="google">Google Style (Algorithmic depth & scales)</option>
                                    <option value="product">Product Focused (UX & trade-offs)</option>
                                </select>
                            </div>
                        </div>

                        {/* Job Description & ATS matching */}
                        {renderJobDescriptionSection()}

                        {/* Submit Button */}
                        <Button
                            onClick={startManualInterview}
                            disabled={isLoading}
                            size="lg"
                            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] text-white hover:opacity-95 rounded-xl transition-all shadow-md"
                        >
                            {isLoading ? 'Generating Session...' : 'Start Manual Interview'}
                        </Button>

                    </div>
                </div>
            )}

            {/* Step 3: Resume Upload Form */}
            {step === 'resume_upload' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <button
                            onClick={() => setStep('choose_type')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-2xl font-bold text-foreground">Upload Resume</h2>
                        <div className="w-10" />
                    </div>

                    <div className="space-y-6">
                        {isParsing ? (
                            <div className="p-12 rounded-3xl bg-secondary/10 border border-border/50 backdrop-blur-md flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="relative flex items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-[var(--accent-teal)]/20 border-t-[var(--accent-teal)] rounded-full animate-spin" />
                                    <Brain className="w-6 h-6 text-[var(--accent-teal)] absolute animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-foreground">Analyzing Resume Profile</h3>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        AI is extracting your skills, professional experience, projects, and estimating your matching job role...
                                    </p>
                                </div>
                                <div className="w-full max-w-xs bg-muted/40 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] transition-all duration-500"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[300px] ${dragActive
                                        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/5'
                                        : 'border-border bg-background/30 hover:bg-background/50 hover:border-muted-foreground/60'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    id="resume-upload-file"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <label htmlFor="resume-upload-file" className="cursor-pointer flex flex-col items-center gap-4">
                                    <div className="p-4 rounded-full bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]">
                                        <UploadCloud className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-lg font-bold text-foreground">Select PDF Resume</h3>
                                        <p className="text-xs text-muted-foreground">Drag & drop your PDF file here, or click to browse</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/30 border border-border text-[10px] text-muted-foreground">
                                        <AlertCircle className="w-3 h-3 text-amber-400" />
                                        Max File Size: 5MB (PDF only)
                                    </div>
                                </label>
                            </div>
                        )}

                        {user?.parsedResume && !isParsing && (
                            <button
                                onClick={() => enterReviewScreen(user.parsedResume)}
                                className="w-full p-4 rounded-xl border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/5 hover:bg-[var(--accent-teal)]/10 text-xs font-semibold text-[var(--accent-teal)] flex items-center justify-center gap-2 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Review previously uploaded resume instead
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 4: Resume Review & Customization */}
            {step === 'resume_review' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <button
                            onClick={() => setStep('resume_upload')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Upload Different Resume
                        </button>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Profile Verification
                        </h2>
                        <div className="w-10" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Primary details left column */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="p-6 sm:p-8 rounded-3xl bg-secondary/10 border border-border/40 space-y-6">

                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected Profile Fields</h3>

                                {/* Edit Role */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Job Role</label>
                                    <input
                                        type="text"
                                        value={detectedRole}
                                        onChange={(e) => setDetectedRole(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-[var(--accent-teal)] focus:outline-none text-sm font-medium"
                                        placeholder="e.g. Frontend Developer"
                                    />
                                </div>

                                {/* Edit Experience */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground">Years of Experience</label>
                                    <input
                                        type="text"
                                        value={detectedExperience}
                                        onChange={(e) => setDetectedExperience(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-[var(--accent-teal)] focus:outline-none text-sm font-medium"
                                        placeholder="e.g. 3 Years"
                                    />
                                </div>

                                {/* Edit Skills tags */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Target Skills (Used for question generation)</label>

                                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-background/50 border border-border/50 min-h-[60px]">
                                        {detectedSkills.map(skill => (
                                            <span
                                                key={skill}
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 text-[var(--accent-teal)]"
                                            >
                                                {skill}
                                                <button onClick={() => removeResumeSkill(skill)} className="hover:text-red-400 ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newResumeSkill}
                                            onChange={(e) => setNewResumeSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResumeSkill(newResumeSkill))}
                                            placeholder="Add skill (e.g. GraphQL, Tailwind)..."
                                            className="flex-1 px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-teal)] text-xs"
                                        />
                                        <button
                                            onClick={() => addResumeSkill(newResumeSkill)}
                                            className="px-3 rounded-xl bg-muted text-xs hover:bg-muted/80 text-foreground"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Job Description & ATS matching */}
                            {renderJobDescriptionSection()}
                        </div>

                        {/* Projects column */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-secondary/10 border border-border/40 h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected Projects</h3>

                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                        {detectedProjects.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No projects found. AI will ask general scenario questions.</p>
                                        ) : (
                                            detectedProjects.map((p, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-background/50 border border-border/40 space-y-1">
                                                    <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                                                    {p.techStack && p.techStack.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                            {p.techStack.slice(0, 3).map(tech => (
                                                                <span key={tech} className="text-[8px] px-1.5 py-0.2 bg-muted rounded font-medium text-muted-foreground">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 space-y-3">
                                    <Button
                                        onClick={startResumeInterview}
                                        disabled={isLoading || isParsing}
                                        className="w-full h-11 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                                    >
                                        {isLoading ? 'Starting Interview...' : 'Confirm & Start Interview'}
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground">
                                        Your questions will be tailored 40% to your skills, 30% to these projects, and 20% to scenarios.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
