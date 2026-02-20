'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';

export default function SettingsPage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-8 animate-fade-in">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account and subscription.</p>
            </div>

            {/* Profile */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Name</p>
                            <p className="text-base font-semibold text-white">{user.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</p>
                            <p className="text-base font-semibold text-white">{user.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Transparency */}
            <div className="space-y-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    💳 Subscription
                </h2>
                <SubscriptionCard />
            </div>

            <div className="flex justify-end pt-2">
                <Button variant="destructive" onClick={logout} className="text-sm">
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
