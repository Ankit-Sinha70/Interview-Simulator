import React, { useState } from 'react';
import Link from 'next/link';
import {     Award, 
    BookOpen, 
    Briefcase, 
    Calendar, 
    ChevronDown, 
    ChevronUp, 
    Compass, 
    FileCheck2, 
    Flame, 
    HelpCircle, 
    LayoutList, 
    Map, 
    RefreshCw, 
    Sparkles, 
    TrendingUp, 
    User, 
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    CheckCircle2,
    Lock,
    Code,
    ShieldAlert,
    FileText
} from 'lucide-react';


// ==========================================
// 1. READINESS METER
// ==========================================
interface ReadinessMeterProps {
    score: number;
    breakdown: {
        technical: number;
        communication: number;
        confidence: number;
        consistency: number;
    };
    roleSuitability: string;
    aiRecommendation: string;
}

export function ReadinessMeter({ score, breakdown, roleSuitability, aiRecommendation }: ReadinessMeterProps) {
    const getScoreColor = (val: number) => {
        if (val >= 80) return 'from-emerald-500 to-teal-400 text-emerald-400';
        if (val >= 60) return 'from-violet-500 to-indigo-500 text-violet-400';
        return 'from-amber-500 to-orange-500 text-amber-400';
    };

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Dial Gauge */}
                <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-36 h-36 transform -rotate-90">
                        <circle
                            cx="72"
                            cy="72"
                            r="62"
                            className="stroke-muted-foreground/10 fill-none"
                            strokeWidth="10"
                        />
                        <circle
                            cx="72"
                            cy="72"
                            r="62"
                            className="stroke-violet-600 fill-none transition-all duration-1000 ease-out"
                            strokeWidth="12"
                            strokeDasharray={2 * Math.PI * 62}
                            strokeDashoffset={2 * Math.PI * 62 * (1 - score / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">{score}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Readiness</span>
                    </div>
                </div>

                {/* Categories Breakdown */}
                <div className="flex-1 w-full space-y-4">
                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <Briefcase className="w-3.5 h-3.5" />
                            Hiring Readiness Assessment
                        </span>
                        <h3 className="text-xl font-bold text-foreground mt-1">{roleSuitability || 'Calculating Suitability...'}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Technical Skills', val: breakdown.technical, color: 'bg-indigo-500' },
                            { label: 'Communication', val: breakdown.communication, color: 'bg-emerald-500' },
                            { label: 'Confidence', val: breakdown.confidence, color: 'bg-sky-500' },
                            { label: 'Consistency', val: breakdown.consistency, color: 'bg-amber-500' }
                        ].map((cat, i) => (
                            <div key={i} className="space-y-1 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium">{cat.label}</span>
                                    <span className="font-bold text-foreground">{cat.val}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.val}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Recommendation */}
            <div className="pt-4 border-t border-border/40 flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-violet-600/15 text-violet-400 border border-violet-500/25 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">AI Mentor Suggestion</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiRecommendation}</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. SKILL GAP MATRIX
// ==========================================
interface SkillGapProps {
    gaps: {
        skill: string;
        expectedScore: number;
        candidateScore: number;
    }[];
    insight: string;
}

export function SkillGapMatrix({ gaps, insight }: SkillGapProps) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Compass className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Skill Gap Analysis</h3>
                    <p className="text-xs text-muted-foreground">Expected vs Candidate rating comparison</p>
                </div>
            </div>

            <div className="space-y-4">
                {gaps && gaps.map((gap, i) => {
                    const diff = gap.candidateScore - gap.expectedScore;
                    return (
                        <div key={i} className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold text-foreground">{gap.skill}</span>
                                <div className="text-xs space-x-2">
                                    <span className="text-muted-foreground font-medium">Expected: <strong className="text-foreground">{gap.expectedScore}/10</strong></span>
                                    <span className="text-muted-foreground font-medium">Actual: <strong className="text-violet-400">{gap.candidateScore}/10</strong></span>
                                </div>
                            </div>
                            <div className="relative h-4 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                                {/* Target line marker */}
                                <div 
                                    className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/60 z-10" 
                                    style={{ left: `${gap.expectedScore * 10}%` }}
                                    title={`Expected: ${gap.expectedScore}`}
                                />
                                {/* Candidate score block */}
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                                        diff >= 0 ? 'from-emerald-600 to-teal-500' : 'from-violet-600 to-indigo-500'
                                    }`} 
                                    style={{ width: `${gap.candidateScore * 10}%` }} 
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                                <span>Fundamental</span>
                                <span>Advanced</span>
                                <span>Expert</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-500/10 space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-teal-400 uppercase">Weakest Skill Focus</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
            </div>
        </div>
    );
}

// ==========================================
// 3. AI CAREER COACH PANEL
// ==========================================
interface AICoachPanelProps {
    coachMessage: string;
    recommendations: string[];
    onRefresh: () => Promise<void>;
    planType: string;
}

export function AICoachPanel({ coachMessage, recommendations, onRefresh, planType }: AICoachPanelProps) {
    const [loading, setLoading] = useState(false);

    const handleRefresh = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await onRefresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">AI Career Coach</h3>
                        <p className="text-xs text-muted-foreground">Action-oriented personal interview mentor</p>
                    </div>
                </div>

                {planType === 'PRO' && (
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground rounded-lg border border-white/[0.08] transition-all disabled:opacity-40"
                        title="Recalculate Coach Advice"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                    "{coachMessage}"
                </p>

                {recommendations && recommendations.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Action Checklist</h4>
                        <div className="grid gap-2.5">
                            {recommendations.map((rec, i) => (
                                <div key={i} className="flex gap-2.5 items-start p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                    <div className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs text-muted-foreground leading-relaxed">{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 4. ROADMAP PLANNER
// ==========================================
interface RoadmapProps {
    roadmap: {
        week: number;
        topic: string;
        focusItems: string[];
    }[];
}

export function RoadmapPlanner({ roadmap }: RoadmapProps) {
    const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Map className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Personalized Study Plan</h3>
                    <p className="text-xs text-muted-foreground">Targeted roadmap based on mock interview gaps</p>
                </div>
            </div>

            <div className="space-y-3">
                {roadmap && roadmap.map((weekData, i) => {
                    const isExpanded = expandedWeek === weekData.week;
                    return (
                        <div 
                            key={i} 
                            className={`border rounded-xl transition-all duration-200 ${
                                isExpanded 
                                    ? 'bg-white/[0.02] border-violet-500/30' 
                                    : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02]'
                            }`}
                        >
                            <button
                                onClick={() => setExpandedWeek(isExpanded ? null : weekData.week)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                        isExpanded ? 'bg-violet-600/20 text-violet-400' : 'bg-white/[0.06] text-muted-foreground'
                                    }`}>
                                        Week {weekData.week}
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{weekData.topic}</span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/[0.04] animate-fade-in">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Study Focus Items</div>
                                    <div className="grid gap-2">
                                        {weekData.focusItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-2.5 items-center p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                                                <input 
                                                    type="checkbox" 
                                                    id={`item-${weekData.week}-${idx}`}
                                                    className="w-4 h-4 rounded text-violet-600 bg-black/40 border-white/20 focus:ring-violet-500 cursor-pointer"
                                                />
                                                <label 
                                                    htmlFor={`item-${weekData.week}-${idx}`}
                                                    className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
                                                >
                                                    {item}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// 5. RESUME ALIGNMENT CARD
// ==========================================
interface ResumeAlignmentProps {
    alignment: {
        alignmentScore: number;
        insights: string[];
        strongSkills: string[];
        improvementSkills: string[];
    };
}

export function ResumeAlignmentCard({ alignment }: ResumeAlignmentProps) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Resume Claim Alignment</h3>
                        <p className="text-xs text-muted-foreground">Comparing claims against performance ratings</p>
                    </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">{alignment.alignmentScore}% Match</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="text-xs text-muted-foreground leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                    {alignment.insights && alignment.insights.map((ins, i) => (
                        <p key={i} className="mb-2 last:mb-0">{ins}</p>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Strong Verified Skills */}
                    <div className="space-y-2 bg-emerald-500/[0.02] border border-emerald-500/10 p-3 rounded-xl">
                        <h4 className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Verified Resume Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {alignment.strongSkills && alignment.strongSkills.length > 0 ? (
                                alignment.strongSkills.map((sk, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">
                                        {sk}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] text-muted-foreground font-medium px-1">None verified yet.</span>
                            )}
                        </div>
                    </div>

                    {/* Needs Practice */}
                    <div className="space-y-2 bg-rose-500/[0.02] border border-rose-500/10 p-3 rounded-xl">
                        <h4 className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">Claims Needing Practice</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {alignment.improvementSkills && alignment.improvementSkills.length > 0 ? (
                                alignment.improvementSkills.map((sk, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full font-bold">
                                        {sk}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] text-muted-foreground font-medium px-1">No major gaps identified.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 6. MATCH BREAKDOWN WIDGET
// ==========================================
interface MatchBreakdownProps {
    overallScore: number;
    resumeScore: number;
    githubScore: number;
    detectedTechs?: string[];
    strongAreas?: string[];
    planType: string;
}

export function MatchBreakdownCard({ overallScore, resumeScore, githubScore, detectedTechs = [], strongAreas = [], planType }: MatchBreakdownProps) {
    const isPro = planType === 'PRO';

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Blended Profile Match</h3>
                    <p className="text-xs text-muted-foreground">Match compatibility across resume, code, and JD</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dial 1: Overall */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-muted-foreground/10 fill-none" strokeWidth="6" />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-amber-500 fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - overallScore / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute top-[48px] text-lg font-black text-foreground">{overallScore}%</span>
                    <span className="text-xs font-bold text-muted-foreground mt-3">Blended Overall Match</span>
                </div>

                {/* Dial 2: Resume */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                    <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-muted-foreground/10 fill-none" strokeWidth="6" />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-[var(--accent-teal)] fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - resumeScore / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute top-[48px] text-lg font-black text-foreground">{resumeScore}%</span>
                    <span className="text-xs font-bold text-muted-foreground mt-3">Resume vs JD Match</span>
                </div>

                {/* Dial 3: GitHub */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-muted-foreground/10 fill-none" strokeWidth="6" />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-indigo-500 fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - (isPro ? githubScore : 50) / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute top-[48px] text-lg font-black text-foreground">{isPro ? githubScore : 0}%</span>
                    <span className="text-xs font-bold text-muted-foreground mt-3">GitHub Code Match</span>
                    
                    {!isPro && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80 backdrop-blur-[1.5px] p-2 rounded-xl">
                            <Lock className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-indigo-400">PRO Only</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tech stack / highlights from Github summary if Pro */}
            {isPro && (detectedTechs.length > 0 || strongAreas.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {detectedTechs.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Code className="w-3.5 h-3.5 text-indigo-400" /> Detected Technologies
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {detectedTechs.slice(0, 8).map(tech => (
                                    <span key={tech} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-semibold">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {strongAreas.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-[var(--accent-teal)]" /> Strongest Competencies
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {strongAreas.slice(0, 4).map(area => (
                                    <span key={area} className="px-2 py-0.5 rounded bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--accent-teal)]/20 text-[9px] font-semibold">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==========================================
// 7. VALIDATION SCORES WIDGET
// ==========================================
interface ValidationScoresProps {
    resumeValidation: number;
    githubValidation: number;
    planType: string;
}

export function ValidationScoresCard({ resumeValidation, githubValidation, planType }: ValidationScoresProps) {
    const isPro = planType === 'PRO';

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-teal)]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--accent-teal)]/20">
                    <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Knowledge & Evidence Verification</h3>
                    <p className="text-xs text-muted-foreground">Post-interview score validation against profiles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume Validation */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[var(--accent-teal)]" /> Resume Claim Verification
                        </span>
                        <span className="font-extrabold text-foreground">{resumeValidation}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-[var(--accent-teal)] rounded-full" style={{ width: `${resumeValidation}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Measures how well mock interview answers back up claims on the CV.
                    </p>
                </div>

                {/* GitHub Validation */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <Code className="w-3.5 h-3.5 text-indigo-400" /> GitHub Repository Evidence
                        </span>
                        <span className="font-extrabold text-foreground">{isPro ? githubValidation : 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full" style={{ width: `${isPro ? githubValidation : 0}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Measures correlation between codebase findings and interview answers.
                    </p>
                    
                    {!isPro && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80 backdrop-blur-[1.5px] p-4 rounded-xl">
                            <Lock className="w-4 h-4 text-indigo-400 mb-1.5" />
                            <h4 className="text-xs font-bold text-foreground mb-0.5">PRO Metric</h4>
                            <Link href="/pricing" className="text-[8px] text-indigo-400 font-semibold hover:underline">Upgrade to unlock &rarr;</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 8. RECRUITER RECOMMENDATION WIDGET
// ==========================================
interface RecruiterRecommendationProps {
    recommendation: 'YES' | 'NO';
    reason: string;
    concerns: string[];
    planType: string;
}

export function RecruiterRecommendationCard({ recommendation, reason, concerns = [], planType }: RecruiterRecommendationProps) {
    const isPro = planType === 'PRO';

    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Recruiter Decision Review</h3>
                        <p className="text-xs text-muted-foreground">Simulated AI recruiter hire decision</p>
                    </div>
                </div>

                <div className="flex shrink-0">
                    {recommendation === 'YES' ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">HIRE RECOMMENDATION</span>
                        </div>
                    ) : (
                        <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                            <ThumbsDown className="w-4 h-4 text-rose-400" />
                            <span className="text-sm font-extrabold uppercase tracking-wider text-rose-400">HOLD / NO-HIRE</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl space-y-2 relative">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Decision Rationale
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {isPro ? reason : "AI recruiter reasoning is locked for Free plans. Upgrade to read the full decision justification."}
                    </p>
                    
                    {!isPro && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/70 backdrop-blur-[1px] p-2 rounded-xl">
                            <Lock className="w-4 h-4 text-violet-400 mb-1" />
                            <Link href="/pricing" className="text-[10px] text-violet-400 font-bold hover:underline">Unlock Recruiter Rationale &rarr;</Link>
                        </div>
                    )}
                </div>

                {isPro && concerns && concerns.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-rose-400" /> Recruiter Concerns
                        </h4>
                        <div className="grid gap-2">
                            {concerns.map((con, i) => (
                                <div key={i} className="flex gap-2.5 items-start p-3 bg-rose-500/[0.01] border border-rose-500/10 rounded-xl">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                                    <span className="text-xs text-muted-foreground leading-relaxed">{con}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
