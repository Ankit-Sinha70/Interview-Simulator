'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { evaluateATS, updateResumeData, uploadResume } from '@/services/api';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Brain,
    CheckCircle2, Code,
    FileText,
    Loader2, Lock,
    Target,
    UploadCloud,
    X
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface SessionSetupProps {
    onStart: (
        role: string,
        experienceLevel: 'Junior' | 'Mid' | 'Senior',
        interviewStyle: 'friendly' | 'strict' | 'faang',
        companyStyle: 'google' | 'startup' | 'product' | 'general',
        useResumeFlag?: boolean,
        interviewMode?: 'manual' | 'resume' | 'resume_jd'
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
    const isPro = user?.planType === 'PRO';

    // Step state: 'choose_type' | 'manual_setup' | 'resume_upload' | 'candidate_review'
    const [step, setStep] = useState<'choose_type' | 'manual_setup' | 'resume_upload' | 'candidate_review'>('choose_type');
    const [currentFlow, setCurrentFlow] = useState<'manual' | 'resume' | 'resume_jd'>('manual');

    // --- JD / ATS STATE ---
    const [jobDescription, setJobDescription] = useState(user?.targetJobDescription?.rawText || '');
    const [targetCompany, setTargetCompany] = useState(user?.targetJobDescription?.company || 'General');
    const [customCompany, setCustomCompany] = useState('');
    const [atsLoading, setAtsLoading] = useState(false);

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
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // File upload state
    const [isParsing, setIsParsing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const getCompanyStyleForStart = (co: string) => {
        const lower = co.toLowerCase();
        if (lower.includes('google')) return 'google';
        if (lower.includes('startup')) return 'startup';
        if (lower.includes('product') || lower.includes('netflix') || lower.includes('stripe') || lower.includes('apple') || lower.includes('meta') || lower.includes('amazon') || lower.includes('microsoft')) return 'product';
        return 'general';
    };

    const enterReviewScreen = (parsedData: any) => {
        setDetectedRole(parsedData.role || parsedData.rolePreference || 'Software Developer');
        setDetectedExperience(parsedData.experienceYears || '2-3 Years');

        const skillsSet = new Set<string>();
        if (Array.isArray(parsedData.skills)) parsedData.skills.forEach((s: any) => skillsSet.add(String(s)));
        if (Array.isArray(parsedData.technologies)) parsedData.technologies.forEach((t: any) => skillsSet.add(String(t)));
        setDetectedSkills(Array.from(skillsSet));

        setDetectedProjects(parsedData.projects || []);
        setStep('candidate_review');
    };

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
            await uploadResume(formData);

            setUploadProgress(80);
            await refreshUser();

            setUploadProgress(100);

            // Fetch the freshly updated user profile
            const updatedUserRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (updatedUserRes.ok) {
                const userJson = await updatedUserRes.json();
                const parsed = userJson.data.parsedResume;

                // If JD Match flow, we run ATS evaluate next
                if (currentFlow === 'resume_jd' && jobDescription.trim()) {
                    setUploadProgress(90);
                    const companyName = targetCompany === 'Custom' ? customCompany : targetCompany;
                    const role = parsed.role || 'Software Developer';
                    const res = await evaluateATS(jobDescription.trim(), role, companyName);
                    if (res && res.atsScore) {
                        toast.success('Resume & Job Description Analysis Completed!');
                    }
                } else {
                    toast.success('Resume analyzed successfully');
                }

                await refreshUser();

                // Re-fetch to get final scores
                const finalUserRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (finalUserRes.ok) {
                    const finalJson = await finalUserRes.json();
                    enterReviewScreen(finalJson.data.parsedResume);
                }
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
            false,
            'manual'
        );
    };

    const startResumeInterview = async () => {
        setIsParsing(true);
        try {
            await updateResumeData({
                role: detectedRole,
                experienceYears: detectedExperience,
                skills: detectedSkills,
                projects: detectedProjects
            });

            await refreshUser();

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
                true,
                currentFlow
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
                <div className="space-y-8 animate-fade-in">
                    <div className="text-center space-y-4">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--accent-violet)]/20 to-[var(--accent-teal)]/20 border border-[var(--accent-violet)]/30 mb-2">
                            <span className="text-xs font-semibold tracking-wider text-[var(--accent-teal)] uppercase">Mode Selection</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                            Choose Your <span className="text-gradient-hero">Interview Setup</span>
                        </h1>
                        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                            Configure your topics manually or let AI tailor a hyper-realistic mock interview based on your career profiles.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4">

                        {/* Option 1: Manual Setup */}
                        <Card
                            onClick={() => { setCurrentFlow('manual'); setStep('manual_setup'); }}
                            className="group cursor-pointer border border-border/50 bg-card/60 backdrop-blur-md hover:bg-card hover:border-[var(--accent-violet)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,92,231,0.12)] flex flex-col justify-between"
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 rounded-2xl bg-[var(--accent-violet)]/10 w-fit group-hover:scale-110 transition-transform duration-300">
                                    <Code className="w-8 h-8 text-[var(--accent-violet)]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-foreground group-hover:text-[var(--accent-violet)] transition-colors">
                                        Manual Interview
                                    </h2>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Select your role, experience level, and target skills manually. Ideal for focused preparation on specific domains.
                                    </p>
                                </div>
                                <div className="pt-2 text-xs font-semibold text-[var(--accent-violet)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Setup manually &rarr;
                                </div>
                            </CardContent>
                        </Card>

                        {/* Option 2: Resume-Based Setup */}
                        <Card
                            onClick={() => { setCurrentFlow('resume'); setStep('resume_upload'); }}
                            className="group cursor-pointer border border-border/50 bg-card/60 backdrop-blur-md hover:bg-card hover:border-[var(--accent-teal)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(45,210,188,0.12)] flex flex-col justify-between"
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 rounded-2xl bg-[var(--accent-teal)]/10 w-fit group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-8 h-8 text-[var(--accent-teal)]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-foreground group-hover:text-[var(--accent-teal)] transition-colors">
                                        Resume-Based Interview
                                    </h2>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Upload your PDF resume. AI extracts your work background and projects to generate tailored mock questions.
                                    </p>
                                </div>
                                <div className="pt-2 text-xs font-semibold text-[var(--accent-teal)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Upload Resume &rarr;
                                </div>
                            </CardContent>
                        </Card>

                        {/* Option 3: Resume + JD Setup */}
                        <Card
                            onClick={() => { setCurrentFlow('resume_jd'); setStep('resume_upload'); }}
                            className="group cursor-pointer border border-border/50 bg-card/60 backdrop-blur-md hover:bg-card hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)] flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-bl">
                                Flagship Mode
                            </div>
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 rounded-2xl bg-amber-500/10 w-fit group-hover:scale-110 transition-transform duration-300">
                                    <Target className="w-8 h-8 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                                        Resume + JD Match ⭐
                                    </h2>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Recruiter-grade simulation. Upload resume and JD to analyze skills gaps, predict readiness, and validate missing skills.
                                    </p>
                                </div>
                                <div className="pt-2 text-xs font-semibold text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Optimize & Match &rarr;
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            )}

            {/* Step 2: Manual Setup Form */}
            {step === 'manual_setup' && (
                <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <button
                            onClick={() => setStep('choose_type')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-2xl font-bold text-foreground">Manual Setup</h2>
                        <div className="w-10" />
                    </div>

                    <div className="p-6 sm:p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-border/50 space-y-6">
                        {/* Job Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Select Job Role</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROLES.map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => { setManualRole(r); setCustomManualRole(''); }}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${manualRole === r
                                            ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                                            : 'border-border/50 bg-background/25 text-muted-foreground hover:bg-background/80'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setManualRole('Custom')}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${manualRole === 'Custom'
                                        ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                                        : 'border-border/50 bg-background/25 text-muted-foreground hover:bg-background/80'
                                        }`}
                                >
                                    Custom Role
                                </button>
                            </div>

                            {manualRole === 'Custom' && (
                                <input
                                    type="text"
                                    value={customManualRole}
                                    onChange={(e) => setCustomManualRole(e.target.value)}
                                    placeholder="Enter custom role title..."
                                    className="w-full mt-3 px-4 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-sm"
                                />
                            )}
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Experience Seniority</label>
                            <div className="flex gap-2">
                                {(['Junior', 'Mid', 'Senior'] as const).map(l => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setManualLevel(l)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${manualLevel === l
                                            ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                                            : 'border-border/50 bg-background/25 text-muted-foreground hover:bg-background/80'
                                            }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skills Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Skills Focus</label>
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-background/40 border border-border/50 min-h-[60px]">
                                {manualSkills.map(skill => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/30 text-[var(--accent-violet)]"
                                    >
                                        {skill}
                                        <button onClick={() => removeManualSkill(skill)} className="hover:text-red-400 ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualSkill(skillInput))}
                                    placeholder="Add tech skill (e.g. Docker, Redis)..."
                                    className="flex-1 px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-xs"
                                />
                                <button
                                    onClick={() => addManualSkill(skillInput)}
                                    className="px-4 rounded-xl bg-muted text-xs hover:bg-muted/80 text-foreground font-semibold"
                                >
                                    Add
                                </button>
                            </div>

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

                        {/* Interview Persona selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">Interviewer Persona</label>
                                <select
                                    value={manualDifficulty}
                                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-sm font-medium"
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
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-violet)] text-sm font-medium"
                                >
                                    <option value="general">General Balanced</option>
                                    <option value="startup">Startup Focus (High velocity & range)</option>
                                    <option value="google">Google Style (Algorithmic depth & scale)</option>
                                    <option value="product">Product Focused (UX & trade-offs)</option>
                                </select>
                            </div>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={startManualInterview}
                            disabled={isLoading}
                            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] text-white hover:opacity-95 rounded-xl transition-all shadow-md mt-6"
                        >
                            {isLoading ? 'Generating Session...' : 'Start Manual Interview'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Resume & Job Description Upload Screen */}
            {step === 'resume_upload' && (
                <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <button
                            onClick={() => setStep('choose_type')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-2xl font-bold text-foreground">
                            {currentFlow === 'resume_jd' ? 'Resume + Job Description Match' : 'Upload Resume'}
                        </h2>
                        <div className="w-10" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left column: Resume uploader */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-foreground">1. Upload Your Resume</label>
                            {isParsing ? (
                                <div className="p-12 rounded-3xl bg-card/60 backdrop-blur-md border border-border/50 flex flex-col items-center justify-center space-y-6 text-center h-[320px]">
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-[var(--accent-teal)]/20 border-t-[var(--accent-teal)] rounded-full animate-spin" />
                                        <Brain className="w-6 h-6 text-[var(--accent-teal)] absolute animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-foreground">AI Profile Extraction</h3>
                                        <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                            Extracting tech skills, job achievements, and project descriptions...
                                        </p>
                                    </div>
                                    <div className="w-full max-w-xs bg-muted/40 h-2 rounded-full overflow-hidden">
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
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[320px] bg-card/40 hover:bg-card/75 ${dragActive
                                        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal)]/5'
                                        : 'border-border/60'
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
                                            <UploadCloud className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground">Select PDF Resume</h3>
                                            <p className="text-xs text-muted-foreground">Drag & drop your PDF file here, or click to browse</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-muted/30 border border-border text-[9px] text-muted-foreground">
                                            <AlertCircle className="w-3 h-3 text-amber-500" />
                                            Max File Size: 5MB (PDF only)
                                        </div>
                                    </label>
                                </div>
                            )}

                            {user?.parsedResume && !isParsing && (
                                <button
                                    onClick={() => enterReviewScreen(user.parsedResume)}
                                    className="w-full p-3.5 rounded-xl border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/5 hover:bg-[var(--accent-teal)]/10 text-xs font-bold text-[var(--accent-teal)] flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    Use previously uploaded resume profile
                                </button>
                            )}
                        </div>

                        {/* Right column: JD text / details */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-foreground">
                                {currentFlow === 'resume_jd' ? '2. Paste Target Job Description' : 'Resume Mode Information'}
                            </label>

                            {currentFlow === 'resume_jd' ? (
                                <div className="p-5 rounded-3xl bg-card/60 border border-border/50 space-y-4 min-h-[320px] flex flex-col justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Target Company</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['General', 'Google', 'Meta', 'Stripe', 'Startup', 'Custom'].map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => { setTargetCompany(c); if (c !== 'Custom') setCustomCompany(''); }}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${targetCompany === c
                                                            ? 'border-amber-500 bg-amber-500/10 text-amber-500 dark:text-amber-400'
                                                            : 'border-border bg-background/25 text-muted-foreground hover:bg-background/80'
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
                                                    placeholder="Enter company name (e.g. OpenAI)..."
                                                    className="w-full mt-2 px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-amber-500 text-xs font-semibold"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Job Description Details</label>
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste target job requirements, technologies, and skills here to calculate fit rating and validate missing skills..."
                                                rows={6}
                                                className="w-full p-3 rounded-xl bg-background border border-border focus:outline-none focus:border-amber-500 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-muted-foreground flex gap-1.5 items-start">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        Our comparison engine matches resume skills against target JD requirements to identify skill gaps.
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-3xl bg-card/60 border border-border/50 space-y-4 min-h-[320px] flex flex-col justify-center text-center">
                                    <div className="mx-auto p-4 rounded-full bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]">
                                        <Brain className="w-10 h-10 animate-pulse" />
                                    </div>
                                    <div className="space-y-1.5 max-w-xs mx-auto">
                                        <h3 className="text-sm font-bold text-foreground">Tailored Questioning</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            In this mode, mock questions focus 40% on your resume achievements, 30% on projects listed, and 30% on general scenarios.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Step 4: FLAGSHIP Candidate Review Screen */}
            {step === 'candidate_review' && (
                <div className="space-y-6 animate-fade-in">

                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-border/30">
                        <button
                            onClick={() => setStep('resume_upload')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Upload Different Resume
                        </button>
                        <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                            <Award className="w-6 h-6 text-amber-500" /> Candidate Hiring Readiness Review
                        </h2>
                        <div className="w-10" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left/Middle: Readiness, Match breakdown, and gaps */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Dial scores row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* 1. Job Description Alignment Score */}
                                <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Match Score</h3>
                                            <p className="text-[10px] text-muted-foreground">Resume vs Job Description compatibility</p>
                                        </div>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[9px] font-bold">
                                            JD Alignment
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="relative flex items-center justify-center shrink-0">
                                            <svg className="w-24 h-24 transform -rotate-90">
                                                <circle cx="48" cy="48" r="40" className="stroke-muted-foreground/10 fill-none" strokeWidth="6" />
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    className="stroke-amber-500 fill-none transition-all duration-1000"
                                                    strokeWidth="8"
                                                    strokeDasharray={2 * Math.PI * 40}
                                                    strokeDashoffset={2 * Math.PI * 40 * (1 - (user?.atsScore?.score || 50) / 100)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute text-xl font-black text-foreground">{user?.atsScore?.score || 0}%</span>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground">Fit rating</h4>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {user?.atsScore?.score && user.atsScore.score >= 80
                                                    ? 'Strong match for this position. Candidate matches primary requirements.'
                                                    : user?.atsScore?.score && user.atsScore.score >= 60
                                                        ? 'Moderate match. Technical gaps found in required stack.'
                                                        : 'Low match. Consider adding missing keywords to optimize.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Hiring Readiness Score */}
                                <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hiring Readiness</h3>
                                            <p className="text-[10px] text-muted-foreground">Predicted capability for real-world interviews</p>
                                        </div>
                                        <Badge variant="outline" className="bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border-[var(--accent-teal)]/30 text-[9px] font-bold">
                                            Readiness
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="relative flex items-center justify-center shrink-0">
                                            <svg className="w-24 h-24 transform -rotate-90">
                                                <circle cx="48" cy="48" r="40" className="stroke-muted-foreground/10 fill-none" strokeWidth="6" />
                                                <circle
                                                    cx="48"
                                                    cy="48"
                                                    r="40"
                                                    className="stroke-[var(--accent-teal)] fill-none transition-all duration-1000"
                                                    strokeWidth="8"
                                                    strokeDasharray={2 * Math.PI * 40}
                                                    strokeDashoffset={2 * Math.PI * 40 * (1 - (user?.atsScore?.hiringReadiness?.readinessScore || 50) / 100)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute text-xl font-black text-foreground">{user?.atsScore?.hiringReadiness?.readinessScore || 0}%</span>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground">Suitability Check</h4>
                                            <div className="text-[11px] text-muted-foreground space-y-0.5 leading-relaxed">
                                                <div>Ready for: <strong className="text-emerald-400">{user?.atsScore?.hiringReadiness?.readyFor?.[0] || 'Junior roles'}</strong></div>
                                                <div>Improve before: <strong className="text-rose-400">{user?.atsScore?.hiringReadiness?.needsImprovementBefore?.[0] || 'Senior roles'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Job Match Breakdowns (Pro gated) */}
                            <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Recruiter Profile breakdown</h3>

                                {isPro ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Technical Match', val: user?.atsScore?.breakdown?.technicalMatch || 70, color: 'bg-indigo-500' },
                                            { label: 'Experience Match', val: user?.atsScore?.breakdown?.experienceMatch || 70, color: 'bg-emerald-500' },
                                            { label: 'Project Relevance', val: user?.atsScore?.breakdown?.projectRelevance || 75, color: 'bg-sky-500' },
                                            { label: 'Communication Prediction', val: user?.atsScore?.breakdown?.communicationPrediction || 65, color: 'bg-amber-500' }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground font-semibold">{item.label}</span>
                                                    <span className="font-extrabold text-foreground">{item.val}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
                                        {/* Blurred sample breakdown */}
                                        <div className="opacity-30 blur-[4px] pointer-events-none select-none p-4 grid grid-cols-2 gap-4">
                                            {[
                                                { label: 'Technical Match', val: 78, color: 'bg-indigo-500' },
                                                { label: 'Experience Match', val: 68, color: 'bg-emerald-500' },
                                                { label: 'Project Relevance', val: 82, color: 'bg-sky-500' },
                                                { label: 'Communication Prediction', val: 74, color: 'bg-amber-500' }
                                            ].map((item, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span>{item.label}</span>
                                                        <span>{item.val}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Gating lock */}
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/50 backdrop-blur-[1.5px] p-4">
                                            <Lock className="w-4 h-4 text-violet-400 mb-1.5" />
                                            <h4 className="text-xs font-bold text-foreground mb-0.5">Recruiter Breakdown is Locked</h4>
                                            <p className="text-[10px] text-muted-foreground mb-3 max-w-[280px]">Upgrade to Pro to review match details, communication predictions, and project relevance checks.</p>
                                            <Link href="/pricing" className="h-7 px-4 rounded-lg bg-[var(--accent-violet)] text-white font-bold text-[10px] flex items-center justify-center hover:opacity-90">Upgrade to Pro</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Readiness Reasoning & Gaps (Pro gated) */}
                            <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Hiring Readiness Analysis</h3>

                                {isPro ? (
                                    <div className="space-y-3">
                                        {user?.atsScore?.hiringReadiness?.reasoning && user.atsScore.hiringReadiness.reasoning.map((reason: string, i: number) => (
                                            <div key={i} className="flex gap-2.5 items-start p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                                                <span className="text-xs text-muted-foreground leading-relaxed">{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
                                        <div className="opacity-30 blur-[4px] pointer-events-none select-none p-4 space-y-2">
                                            <div className="h-10 bg-white/[0.04] rounded-lg" />
                                            <div className="h-10 bg-white/[0.04] rounded-lg" />
                                            <div className="h-10 bg-white/[0.04] rounded-lg" />
                                        </div>
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/50 backdrop-blur-[1.5px] p-4">
                                            <Lock className="w-4 h-4 text-violet-400 mb-1.5" />
                                            <h4 className="text-xs font-bold text-foreground mb-0.5">Readiness Explanations are Locked</h4>
                                            <p className="text-[10px] text-muted-foreground mb-3 max-w-[280px]">Upgrade to Pro to read full recruiting analysis explaining why you are ready or what gaps are holding you back.</p>
                                            <Link href="/pricing" className="h-7 px-4 rounded-lg bg-[var(--accent-violet)] text-white font-bold text-[10px] flex items-center justify-center hover:opacity-90">Upgrade to Pro</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Right Column: Profile details & actions */}
                        <div className="space-y-6">

                            {/* Profile Info & Gaps */}
                            <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resume Data Profile</h3>
                                    <p className="text-[10px] text-muted-foreground">Adjust detected fields for better tailored questions</p>
                                </div>

                                {isEditingProfile ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground">Detected Role</label>
                                            <input
                                                type="text"
                                                value={detectedRole}
                                                onChange={(e) => setDetectedRole(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-teal)] text-xs font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted-foreground">Experience Level</label>
                                            <input
                                                type="text"
                                                value={detectedExperience}
                                                onChange={(e) => setDetectedExperience(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-[var(--accent-teal)] text-xs font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground">Primary Skills</label>
                                            <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-background/50 border border-border min-h-[50px]">
                                                {detectedSkills.map(sk => (
                                                    <span key={sk} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] text-[9px] font-bold border border-[var(--accent-teal)]/20">
                                                        {sk}
                                                        <button onClick={() => removeResumeSkill(sk)} className="hover:text-red-400">
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="text"
                                                    value={newResumeSkill}
                                                    onChange={(e) => setNewResumeSkill(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResumeSkill(newResumeSkill))}
                                                    placeholder="Add skill..."
                                                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border focus:outline-none focus:border-[var(--accent-teal)] text-xs"
                                                />
                                                <button onClick={() => addResumeSkill(newResumeSkill)} className="px-2.5 rounded-lg bg-muted text-[10px] font-bold">Add</button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsEditingProfile(false)}
                                            className="w-full h-8 text-xs font-bold bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30 rounded-xl hover:bg-[var(--accent-teal)]/20 transition-colors"
                                        >
                                            Save Modifications
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-xs">
                                        <div className="pb-3 border-b border-border/30 space-y-1">
                                            <span className="text-[10px] text-muted-foreground">Parsed Job Title</span>
                                            <div className="font-bold text-foreground truncate">{detectedRole || 'Software Engineer'}</div>
                                        </div>
                                        <div className="pb-3 border-b border-border/30 space-y-1">
                                            <span className="text-[10px] text-muted-foreground">Professional Experience</span>
                                            <div className="font-bold text-foreground">{detectedExperience || '3+ Years'}</div>
                                        </div>
                                        <div className="pb-3 border-b border-border/30 space-y-1">
                                            <span className="text-[10px] text-muted-foreground">Identified Tech Skills ({detectedSkills.length})</span>
                                            <div className="flex flex-wrap gap-1 pt-1.5">
                                                {detectedSkills.slice(0, 8).map(sk => (
                                                    <span key={sk} className="px-2 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground">{sk}</span>
                                                ))}
                                                {detectedSkills.length > 8 && <span className="text-[9px] text-muted-foreground font-semibold px-1">+{detectedSkills.length - 8} more</span>}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="w-full text-center text-[10px] font-bold text-[var(--accent-teal)] hover:underline"
                                        >
                                            Modify Extracted Profile &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gaps: Missing Skills */}
                            {currentFlow === 'resume_jd' && (
                                <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Missing Job Gaps</h3>
                                        <p className="text-[10px] text-muted-foreground">Required by JD but missing from resume claims</p>
                                    </div>

                                    {isPro ? (
                                        <div className="flex flex-wrap gap-1.5 min-h-[50px]">
                                            {user?.atsScore?.missingSkills && user.atsScore.missingSkills.length > 0 ? (
                                                user.atsScore.missingSkills.map((sk: string) => (
                                                    <span key={sk} className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                                        {sk}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No major skills gaps detected!</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
                                            <div className="opacity-30 blur-[4px] pointer-events-none select-none p-3 flex flex-wrap gap-1">
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] rounded">AWS</span>
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] rounded">Docker</span>
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] rounded">GraphQL</span>
                                            </div>
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/50 backdrop-blur-[1px] p-2">
                                                <Lock className="w-3.5 h-3.5 text-violet-400 mb-1" />
                                                <h4 className="text-[10px] font-bold text-foreground">Skills Gaps are Locked</h4>
                                                <Link href="/pricing" className="text-[8px] text-[var(--accent-violet)] font-bold hover:underline">Upgrade to Unlock &rarr;</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Start Actions */}
                            <div className="space-y-3">
                                <Button
                                    onClick={startResumeInterview}
                                    disabled={isLoading || isParsing}
                                    className="w-full h-12 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Creating Session...</>
                                    ) : (
                                        'Start Personalized Interview'
                                    )}
                                </Button>

                                <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-1">
                                    {currentFlow === 'resume_jd'
                                        ? 'Tailored: 30% resume details, 30% JD requirements, 20% validation-testing missing skills, and 20% scenarios.'
                                        : 'Tailored: 40% resume details, 30% project details, and 30% scenarios.'}
                                </p>
                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
