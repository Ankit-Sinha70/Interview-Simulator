
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    planType: 'FREE' | 'PRO';
    interviewsUsedThisMonth: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setUser(json.data);
            } else {
                logout();
            }
        } catch (err) {
            console.error(err);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        setUser(userData);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) await fetchUser(token);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
