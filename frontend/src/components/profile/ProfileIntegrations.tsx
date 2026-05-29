import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { importLinkedIn, analyzeGitHub, GitHubProfile } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Linkedin, Github, FileText, CheckCircle2, AlertTriangle, Code, Star, RefreshCw } from 'lucide-react';

export default function ProfileIntegrations() {
    const { user, refreshUser } = useAuth();
    
    // LinkedIn state
    const [linkedinLoading, setLinkedinLoading] = useState(false);
    const [linkedInFile, setLinkedInFile] = useState<File | null>(null);
    const [linkedinText, setLinkedinText] = useState('');
    const [showLinkedInText, setShowLinkedInText] = useState(false);

    // GitHub state
    const [githubLoading, setGithubLoading] = useState(false);
    const [githubUsername, setGithubUsername] = useState(user?.githubProfile?.username || '');

    const handleLinkedInImport = async () => {
        if (!linkedInFile && !linkedinText.trim()) {
            return toast.error('Please upload a LinkedIn PDF export or paste your profile text');
        }

        try {
            setLinkedinLoading(true);
            const response = await importLinkedIn(
                linkedInFile ? undefined : linkedinText,
                linkedInFile || undefined
            );
            
            if (response.success) {
                toast.success('LinkedIn profile imported and merged!');
                setLinkedInFile(null);
                setLinkedinText('');
                await refreshUser();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to import LinkedIn profile');
        } finally {
            setLinkedinLoading(false);
        }
    };

    const handleGitHubAnalyze = async () => {
        if (!githubUsername.trim()) {
            return toast.error('GitHub username is required');
        }

        try {
            setGithubLoading(true);
            const response = await analyzeGitHub(githubUsername.trim());
            if (response && response.username) {
                toast.success('GitHub repositories analyzed and saved!');
                await refreshUser();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to analyze GitHub profile');
        } finally {
            setGithubLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* LinkedIn Card */}
            <Card className="bg-card/70 backdrop-blur-xl border-border/60 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                            <Linkedin className="w-5 h-5 fill-current" />
                        </div>
                        LinkedIn Profile Import
                    </CardTitle>
                    <CardDescription>
                        Import your career history directly from LinkedIn to enrich your mock interview background.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!showLinkedInText ? (
                        <div className="space-y-4">
                            <Label htmlFor="linkedin-pdf" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Upload LinkedIn PDF Export
                            </Label>
                            <div className="border border-dashed border-border/80 rounded-xl p-6 text-center hover:border-blue-500/40 transition-colors bg-background/30 flex flex-col items-center justify-center gap-2">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                                <div className="text-sm font-medium">
                                    {linkedInFile ? (
                                        <span className="text-foreground font-semibold">{linkedInFile.name}</span>
                                    ) : (
                                        <span>Drag & drop or click to select your PDF</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Go to LinkedIn &gt; More &gt; Save to PDF, then upload it here.
                                </p>
                                <input
                                    type="file"
                                    id="linkedin-pdf"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => setLinkedInFile(e.target.files?.[0] || null)}
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => document.getElementById('linkedin-pdf')?.click()}
                                    className="mt-2 border-border/60 hover:bg-accent"
                                >
                                    Select File
                                </Button>
                            </div>
                            <div className="text-center">
                                <button 
                                    onClick={() => setShowLinkedInText(true)}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                                >
                                    Or paste raw text description instead
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Label htmlFor="linkedin-raw-text">Paste LinkedIn Profile Text</Label>
                            <Textarea
                                id="linkedin-raw-text"
                                placeholder="Paste your about section, experience details, and achievements..."
                                rows={6}
                                value={linkedinText}
                                onChange={(e) => setLinkedinText(e.target.value)}
                                className="bg-background/70 border-border focus-visible:ring-blue-600"
                            />
                            <div className="flex justify-between items-center">
                                <button 
                                    onClick={() => { setShowLinkedInText(false); setLinkedinText(''); }}
                                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline"
                                >
                                    Back to file upload
                                </button>
                            </div>
                        </div>
                    )}

                    <Button 
                        disabled={linkedinLoading} 
                        onClick={handleLinkedInImport} 
                        className="w-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] text-white hover:opacity-95 font-semibold rounded-xl shadow-md transition-all"
                    >
                        {linkedinLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing LinkedIn Profile...</>
                        ) : (
                            'Import Profile'
                        )}
                    </Button>

                    {user?.parsedResume?.rawText && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Professional details parsed. Your career background is active for simulation generation.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GitHub Card */}
            <Card className="bg-card/70 backdrop-blur-xl border-border/60 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-800" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-800/20 text-foreground border border-border/50">
                            <Github className="w-5 h-5" />
                        </div>
                        GitHub Repository Analysis
                    </CardTitle>
                    <CardDescription>
                        Connect your GitHub to analyze languages, projects, and repositories for automated skill matching.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="github-user">GitHub Username</Label>
                        <div className="flex gap-2">
                            <Input
                                id="github-user"
                                placeholder="e.g. torvalds"
                                value={githubUsername}
                                onChange={(e) => setGithubUsername(e.target.value)}
                                className="bg-background/70 border-border focus-visible:ring-zinc-700"
                            />
                            <Button 
                                disabled={githubLoading} 
                                onClick={handleGitHubAnalyze}
                                className="bg-[var(--accent-violet)] hover:bg-violet-700 text-white font-semibold rounded-xl transition-all"
                            >
                                {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {user?.githubProfile && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-border/60">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    AI Technical Summary
                                </h4>
                                <div className="text-sm bg-muted/30 border border-border/50 rounded-xl p-4 text-foreground/90 italic leading-relaxed">
                                    "{user.githubProfile.summary}"
                                </div>
                            </div>

                            {user.githubProfile.repos && user.githubProfile.repos.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Analyzed Public Repositories ({user.githubProfile.repos.length})
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                                        {user.githubProfile.repos.slice(0, 8).map((repo: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-lg border border-border/50 bg-background/20 flex flex-col justify-between gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{repo.name}</span>
                                                    {repo.language && (
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border bg-muted/40">
                                                            {repo.language}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                    {repo.description || 'No description provided.'}
                                                </p>
                                                <div className="flex items-center gap-1 text-[11px] text-amber-400">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{repo.stars || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
