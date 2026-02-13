'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { syncSubscription } from '@/services/api';
import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react'; // Assuming lucide-react is available, or use plain text

function SyncButton() {
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSync = async () => {
        setLoading(true);
        setMsg('');
        try {
            await syncSubscription();
            await refreshUser();
            setMsg('Subscription synced!');
        } catch (err) {
            console.error(err);
            setMsg('Sync failed.');
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(''), 3000);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={loading} className="text-xs h-8">
                {loading ? (
                    <span className="flex items-center gap-1">Checking...</span>
                ) : (
                    <span className="flex items-center gap-1">Check Subscription Status</span>
                )}
            </Button>
            {msg && <span className="text-xs text-green-500 animate-fade-in">{msg}</span>}
        </div>
    );
}

export default function SettingsPage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-lg">{user.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-lg">{user.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card className="border-[var(--accent-violet)]/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Subscription</span>
                        <Badge variant={user.planType === 'PRO' ? 'default' : 'secondary'}>
                            {user.planType} PLAN
                        </Badge>
                    </CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user.planType === 'FREE' ? (
                        <div className="bg-[var(--accent-violet)]/5 p-4 rounded-xl border border-[var(--accent-violet)]/10">
                            <p className="mb-4 text-sm">You are currently on the Free plan. Upgrade to unlock unlimited interviews and advanced analytics.</p>
                            <UpgradeModal trigger={<Button className="w-full">Upgrade to Pro</Button>} />

                            <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2">Already paid but still seeing Free plan?</p>
                                <SyncButton />
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                                {user.interviewsUsedThisMonth} / 2 free interviews used this month.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                            <p className="mb-4 text-sm font-medium text-emerald-500">You have active Pro access!</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                To cancel or manage your subscription, please use the Stripe Customer Portal (link coming soon).
                            </p>
                            <div className="pt-2 border-t border-emerald-500/10">
                                <SyncButton />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>


            <div className="flex justify-end pt-4">
                <Button variant="destructive" onClick={logout}>Sign Out</Button>
            </div>
        </div>
    );
}
