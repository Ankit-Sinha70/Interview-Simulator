'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    LogOut,
    Zap,
    Crown,
    User as UserIcon
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Don't show if no user (though layout might protect it, safer here)
    if (!user) return null;

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active
                    ? 'bg-[var(--accent-violet)] text-white shadow-lg shadow-[var(--accent-violet)]/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
            >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="font-medium text-sm">{label}</span>
                {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
            </Link>
        );
    };

    return (
        <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 z-50 bg-background/80 backdrop-blur-xl border-r border-border/50">
            {/* Logo Section */}
            <div className="p-6 pb-8">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-teal)] flex items-center justify-center text-white font-bold shadow-lg shadow-[var(--accent-violet)]/20 group-hover:scale-105 transition-transform">
                        IS
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-none tracking-tight">Interview</span>
                        <span className="text-[10px] font-bold text-[var(--accent-teal)] uppercase tracking-wider">Simulator</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">Menu</div>
                <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/profile" icon={UserIcon} label="Profile" />
                <NavItem href="/analytics" icon={BarChart3} label="Analytics" />
                <NavItem href="/settings" icon={Settings} label="Settings" />

                {user.planType === 'FREE' ? (
                    <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/10 to-[var(--accent-teal)]/10 border border-[var(--accent-violet)]/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-[var(--accent-violet)]/20 text-[var(--accent-violet)]">
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                            <span className="font-bold text-sm">Pro Plan</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            Unlock unlimited interviews and advanced analytics.
                        </p>
                        <Button size="sm" className="w-full text-xs h-8 bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/90" asChild>
                            <Link href="/settings">Upgrade</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-500">
                                <span className="text-lg leading-none">👑</span>
                            </div>
                            <div>
                                <span className="font-bold text-sm text-foreground">Pro Member</span>
                                <p className="text-[10px] text-muted-foreground">Unlimited Access</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                    {user.profilePicture ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-slate-700">
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <ConfirmDialog
                        title="Sign Out"
                        description="Are you sure you want to sign out?"
                        confirmText="Sign Out"
                        onConfirm={logout}
                        destructive
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </ConfirmDialog>
                </div>
            </div>
        </aside>
    );
}
