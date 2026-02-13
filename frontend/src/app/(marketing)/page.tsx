'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Play } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">

            {/* Navbar */}
            <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent">
                        Interview AI
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
                        <Link href="/interview/start">
                            <Button size="sm" className="rounded-full px-6">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
                    <Badge variant="outline" className="px-4 py-1 rounded-full border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/5 text-[var(--accent-violet)] mb-4 animate-float">
                        🚀 Now with Voice Analysis
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                        Master Your Next <br />
                        <span className="text-gradient-hero">Technical Interview</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Practice with an adaptive AI that challenges you with real-world scenarios, analyzes your voice, and gives strict, actionable feedback.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/interview/start">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-[var(--accent-violet)]/20 hover:scale-105 transition-transform bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)]">
                                Start Free Interview <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50">
                            <Play className="mr-2 h-4 w-4" /> Watch Demo
                        </Button>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-violet)]/10 rounded-full blur-[120px] -z-10" />
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div className="grid md:grid-cols-3 gap-12">
                            <Feature
                                icon="🎯"
                                title="Adaptive Questioning"
                                desc="The AI adjusts difficulty in real-time based on the quality of your answers."
                            />
                            <Feature
                                icon="🎤"
                                title="Voice Confidence"
                                desc="Get feedback on your tone, pacing, filler words, and communication clarity."
                            />
                            <Feature
                                icon="📊"
                                title="Strict Scoring"
                                desc="No sugar-coating. Get a brutal, realistic assessment against senior standards."
                            />
                        </div>
                        {/* Visual Demo Placeholder */}
                        <div className="mt-16 rounded-2xl overflow-hidden border border-border/50 shadow-lg bg-card/50 aspect-video flex items-center justify-center text-muted-foreground">
                            [App Interface Preview Image]
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center space-y-12">
                    <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <Card className="border-2 border-border/50 hover:border-primary transition-colors">
                            <CardContent className="p-8 space-y-6">
                                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Free</span>
                                <div className="text-4xl font-bold">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                <ul className="space-y-3">
                                    <CheckItem text="3 Interviews / month" />
                                    <CheckItem text="Text Mode only" />
                                    <CheckItem text="Basic Scoring" />
                                </ul>
                                <Button className="w-full" variant="outline">Start Free</Button>
                            </CardContent>
                        </Card>
                        <Card className="border-2 border-[var(--accent-violet)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-[var(--accent-violet)] text-white text-xs px-3 py-1 rounded-bl-lg font-bold">MOST POPULAR</div>
                            <CardContent className="p-8 space-y-6">
                                <span className="text-sm font-semibold text-[var(--accent-violet)] uppercase tracking-wider">Pro</span>
                                <div className="text-4xl font-bold">$19<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                <ul className="space-y-3">
                                    <CheckItem text="Unlimited Interviews" />
                                    <CheckItem text="Voice Analysis Mode" />
                                    <CheckItem text="Detailed Roadmap" />
                                </ul>
                                <Button className="w-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)]">Get Pro</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/40 text-center text-muted-foreground text-sm">
                © 2026 Interview Simulator AI. All rights reserved.
            </footer>
        </div>
    );
}

function Feature({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="space-y-4">
            <div className="text-4xl bg-background w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}

function CheckItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-500" />
            </div>
            {text}
        </div>
    );
}
