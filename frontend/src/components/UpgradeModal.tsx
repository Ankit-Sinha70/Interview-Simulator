
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UpgradeModalProps {
    trigger?: React.ReactNode;
}

export default function UpgradeModal({ trigger }: UpgradeModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to start checkout');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || <Button variant="default">Upgrade to Pro</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent">
                        Unlock Unlimited Practice
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Take your interview prep to the next level.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-4 border border-[var(--accent-violet)]/20 bg-[var(--accent-violet)]/5 rounded-xl">
                        <div>
                            <p className="font-medium text-foreground">Pro Plan</p>
                            <p className="text-sm text-muted-foreground">Unlimited AI Interviews & detailed analytics</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold">$12</span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                    </div>

                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            <span>Unlimited Interview Sessions</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            <span>Advanced Performance Analytics</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            <span>Priority Feature Access</span>
                        </li>
                    </ul>
                </div>

                <DialogFooter>
                    <Button onClick={handleUpgrade} disabled={loading} className="w-full bg-[var(--accent-violet)] hover:opacity-90">
                        {loading ? 'Redirecting...' : 'Upgrade Now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
