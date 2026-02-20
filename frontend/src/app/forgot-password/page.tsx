'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (data.success) {
                setSent(true);
                toast.success('Reset link sent', {
                    description: data.message,
                });
            } else {
                toast.error('Something went wrong', {
                    description: data.error || 'Please try again later.',
                });
            }
        } catch (err) {
            toast.error('Network error', {
                description: 'Could not connect to the server. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-10">
            <Card className="w-full max-w-xl border-border/50 bg-card/80 backdrop-blur-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-2">
                        <Mail className="w-7 h-7 text-violet-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {sent ? 'Check Your Email' : 'Forgot Password'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {sent
                            ? 'If an account with that email exists, we\'ve sent a password reset link. Check your inbox and spam folder.'
                            : 'Enter your email address and we\'ll send you a link to reset your password.'
                        }
                    </p>
                </CardHeader>
                <CardContent>
                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-500 font-semibold" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => { setSent(false); setEmail(''); }}
                            >
                                Send to a different email
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-muted-foreground hover:text-violet-400 transition-colors inline-flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
