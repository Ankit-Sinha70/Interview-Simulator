'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, Plus, X } from 'lucide-react';

interface RecentLogin {
    email: string;
    name: string;
}

export default function LoginPage() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('recentLogins');
        if (stored) {
            try {
                setRecentLogins(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse recent logins", e);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin ? { email, password } : { name, email, password };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            // Save to recent logins on successful login
            if (isLogin) {
                const newLogin: RecentLogin = {
                    email: data.data.user.email,
                    name: data.data.user.name
                };
                const existing = recentLogins.filter(l => l.email !== newLogin.email);
                const updatedLogins = [newLogin, ...existing].slice(0, 2); // Keep max 2

                setRecentLogins(updatedLogins);
                localStorage.setItem('recentLogins', JSON.stringify(updatedLogins));
            }

            login(data.data.token, data.data.user);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRecentLoginClick = (email: string) => {
        setIsLogin(true);
        setEmail(email);
        setPassword('');
    };

    const handleRemoveRecentLogin = (e: React.MouseEvent, emailToRemove: string) => {
        e.stopPropagation(); // prevent clicking the card itself
        const updated = recentLogins.filter(l => l.email !== emailToRemove);
        setRecentLogins(updated);
        localStorage.setItem('recentLogins', JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0b0816] text-slate-200 relative overflow-hidden font-sans">
            <main className="flex-1 w-full flex items-center justify-center p-4">
                {/* Single Centered Container */}
                <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 border border-white/10 p-10 rounded-2xl shadow-[0_20px_60px_-10px_rgba(235, 231, 233, 0.8)]">

                    {/* Left Column: Recent Logins */}
                    <div className="w-full max-w-[380px] space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                        {/* Avatar Placeholder */}
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            <img src="./png/avatar.png" alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-white">
                                Recent logins
                            </h1>
                            <p className="text-sm text-slate-400">
                                Click your picture to sign in
                            </p>
                        </div>
                        <hr className="w-full border-white/10" />


                        <div className="flex gap-4 justify-center lg:justify-start flex-wrap max-w-full">
                            {/* Dynamic Profile Cards */}
                            {recentLogins.map((loginData) => (
                                <div
                                    key={loginData.email}
                                    onClick={() => handleRecentLoginClick(loginData.email)}
                                    className="group relative overflow-hidden rounded-2xl bg-[#1c1635] hover:bg-[#231b42] transition-colors cursor-pointer w-[140px] h-[190px] flex flex-col shadow-xl shadow-black/40"
                                >
                                    {/* Close Button */}
                                    <button
                                        onClick={(e) => handleRemoveRecentLogin(e, loginData.email)}
                                        className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hover:text-red-400"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6d5ae6] to-[#8877ff] border border-white/10 flex items-center justify-center text-2xl font-bold text-white uppercase shadow-lg shadow-[#6d5ae6]/20">
                                            {loginData.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="py-4 px-2 truncate text-center font-medium text-sm text-white border-t border-black/20 bg-black/10">
                                        {loginData.name}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                    <div className="hidden lg:block w-px h-[400px] bg-white/10"></div>

                    <div className="block lg:hidden w-full h-px bg-white/10 my-8"></div>
                    <div className="w-full max-w-[420px]">
                        <div className="bg-[#120f22] p-8 rounded-3xl shadow-2xl shadow-black/50 border border-white/5">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}

                                {!isLogin && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400 font-medium px-1">Your name</label>
                                        <Input
                                            placeholder="Name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                            className="h-12 bg-[#1b1731] border-transparent focus-visible:ring-[#6d5ae6] rounded-xl placeholder:text-slate-500 text-sm"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-medium px-1">Your email</label>
                                    <Input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-[#1b1731] border-transparent focus-visible:ring-[#6d5ae6] rounded-xl placeholder:text-slate-500 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5 focus-within:relative">
                                    <div className="flex justify-between px-1">
                                        <label className="text-xs text-slate-400 font-medium">Your password</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors focus:outline-none font-medium"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-[#1b1731] border-transparent focus-visible:ring-[#6d5ae6] rounded-xl pr-10 placeholder:text-slate-500 text-sm"
                                    />
                                </div>

                                <div className="pt-3 space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-[15px] font-semibold bg-[#6d5ae6] hover:bg-[#5b4ad1] text-white rounded-xl transition-all shadow-lg shadow-[#6d5ae6]/20"
                                    >
                                        {isLogin ? 'Log in' : 'Create Account'}
                                    </Button>

                                    {isLogin && (
                                        <div className="text-center pt-1">
                                            <Link href="/forgot-password" className="text-sm text-slate-300 hover:text-white transition-colors">
                                                Forgot your password?
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Switch Mode Button */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="w-[85%] h-12 rounded-full border border-white/10 text-white text-[15px] font-medium hover:bg-white/5 transition-colors bg-transparent"
                            >
                                {isLogin ? 'Create an account' : 'Log in to existing account'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
