
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

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
            login(data.data.token, data.data.user);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="w-full max-w-xl p-6">
                <CardHeader>
                    <CardTitle className="text-center">{isLogin ? 'Login' : 'Register'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        {!isLogin && <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />}
                        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        {isLogin && (
                            <div className="text-right">
                                <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                        )}
                        <Button type="submit" className="w-full">{isLogin ? 'Sign In' : 'Sign Up'}</Button>
                    </form>
                    <div className="text-center mt-4">
                        <button onClick={() => setIsLogin(!isLogin)} className="text-sm underline">
                            {isLogin ? 'Create account' : 'Already have account?'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
