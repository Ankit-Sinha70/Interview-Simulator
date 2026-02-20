'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PasswordCheck {
    label: string;
    test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordCheck[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

type PageState = 'validating' | 'valid' | 'invalid' | 'success';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [pageState, setPageState] = useState<PageState>('validating');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setPageState('invalid');
            return;
        }

        fetch(`${API_BASE}/auth/validate-reset-token?token=${token}`)
            .then(res => res.json())
            .then(data => {
                setPageState(data.success && data.valid ? 'valid' : 'invalid');
            })
            .catch(() => setPageState('invalid'));
    }, [token]);

    const allRulesPass = PASSWORD_RULES.every(r => r.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allRulesPass) {
            toast.error('Password does not meet requirements');
            return;
        }
        if (!passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();

            if (data.success) {
                setPageState('success');
                toast.success('Password updated!', {
                    description: 'You can now log in with your new password.',
                });
                // Redirect to login after 3 seconds
                setTimeout(() => router.push('/login'), 3000);
            } else {
                toast.error('Reset failed', {
                    description: data.error || 'Please try again or request a new reset link.',
                });
                if (data.error?.includes('expired')) {
                    setPageState('invalid');
                }
            }
        } catch (err) {
            toast.error('Network error', {
                description: 'Could not connect to the server.',
            });
        } finally {
            setLoading(false);
        }
    };

    // ─── Loading State ───
    if (pageState === 'validating') {
        return (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-10">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating your reset link...</span>
                </div>
            </div>
        );
    }

    // ─── Invalid / Expired Token ───
    if (pageState === 'invalid') {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mb-2">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Link Expired or Invalid</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            This reset link has expired or has already been used. Please request a new one.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/forgot-password">
                            <Button className="w-full h-11 bg-violet-600 hover:bg-violet-500 font-semibold">
                                Request New Reset Link
                            </Button>
                        </Link>
                        <div className="text-center">
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-violet-400 transition-colors inline-flex items-center gap-1.5">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Success State ───
    if (pageState === 'success') {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-2">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Your password has been updated successfully. Redirecting to login...
                        </p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/login">
                            <Button variant="outline" className="h-11">
                                Go to Login Now
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Reset Form ───
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-10">
            <Card className="w-full max-w-xl border-border/50 bg-card/80 backdrop-blur-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-7 h-7 text-violet-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Choose a strong password for your account.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* New Password */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11"
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-xs text-red-400 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Password Strength Checklist */}
                        {password.length > 0 && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Password Requirements</p>
                                {PASSWORD_RULES.map((rule, i) => {
                                    const passes = rule.test(password);
                                    return (
                                        <div key={i} className={`flex items-center gap-2 text-xs ${passes ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {passes
                                                ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                : <XCircle className="w-3.5 h-3.5 shrink-0" />
                                            }
                                            <span>{rule.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-violet-600 hover:bg-violet-500 font-semibold"
                            disabled={loading || !allRulesPass || !passwordsMatch}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>

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
