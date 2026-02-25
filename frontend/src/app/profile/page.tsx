'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, changePassword, uploadProfilePicture } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Mail, ShieldCheck, CreditCard, Lock, CheckCircle2, AlertCircle, Camera, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [name, setName] = useState(user?.name || '');

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Guard clause - if not logged in
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Name cannot be empty');
        if (name === user.name) return toast.info('No changes made');

        try {
            setIsUpdatingProfile(true);
            await updateProfile(name);
            await refreshUser();
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            return toast.error('Please upload an image file');
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limits
            return toast.error('Image must be less than 5MB');
        }

        try {
            setIsUploadingImage(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;
                await uploadProfilePicture(base64Image);
                await refreshUser();
                toast.success('Profile picture updated!');
            };
            reader.onerror = () => {
                toast.error('Failed to read image file');
                setIsUploadingImage(false);
            };
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
            setIsUploadingImage(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwords;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return toast.error('All password fields are required');
        }

        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match');
        }

        if (newPassword.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return toast.error('Password must contain uppercase, lowercase, and a number');
        }

        try {
            setIsChangingPassword(true);
            await changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-violet-500/10 rounded-full blur-[120px] -translate-y-1/2 opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] translate-y-1/3 opacity-30 pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">

                <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Account Settings</h1>
                    <p className="text-slate-400 mt-2">Manage your profile, password, and subscription details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column - Main Info */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Profile Info Card */}
                        <Card className="animate-fadeInUp bg-card/60 backdrop-blur-xl border-slate-700/50 shadow-2xl" style={{ animationDelay: '100ms' }}>
                            <CardHeader className="flex flex-row items-center gap-6 pb-2">
                                {/* Interactive Avatar */}
                                <div className="relative group cursor-pointer">
                                    <div className="w-28 h-28 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden relative">
                                        {user.profilePicture ? (
                                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="h-8 w-8 text-slate-400" />
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isUploadingImage ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                                            ) : (
                                                <Camera className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="profileImageInput"
                                        onChange={handleImageUpload}
                                        disabled={isUploadingImage}
                                    />
                                    <label htmlFor="profileImageInput" className="absolute inset-0 cursor-pointer rounded-full" />
                                </div>

                                <div>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your personal details and avatar.</CardDescription>
                                </div>
                            </CardHeader>
                            <form onSubmit={handleUpdateProfile}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-slate-900/50 border-slate-700 focus-visible:ring-violet-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address <span className="text-xs text-muted-foreground ml-2">(Read-only)</span></Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                id="email"
                                                value={user.email}
                                                readOnly
                                                className="pl-9 bg-slate-900/50 border-slate-700 opacity-70 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-900/20 border-t border-slate-800 p-4">
                                    <Button type="submit" disabled={isUpdatingProfile || name === user.name} className="bg-violet-600 hover:bg-violet-700 text-white ml-auto">
                                        {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Change Password Card - ONLY LOCAL USERS */}
                        {user.provider === 'local' && (
                            <Card className="animate-fadeInUp bg-card/60 backdrop-blur-xl border-slate-700/50 shadow-2xl" style={{ animationDelay: '200ms' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-emerald-400" />
                                        Change Password
                                    </CardTitle>
                                    <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleChangePassword}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="currentPassword"
                                                    type={showPasswords.current ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    value={passwords.currentPassword}
                                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                                    className="bg-slate-900/50 border-slate-700 focus-visible:ring-emerald-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!passwords.currentPassword}
                                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${!passwords.currentPassword ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-300'}`}
                                                >
                                                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Separator className="my-4 border-slate-800" />
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showPasswords.new ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={passwords.newPassword}
                                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                    className="bg-slate-900/50 border-slate-700 focus-visible:ring-emerald-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!passwords.newPassword}
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${!passwords.newPassword ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-300'}`}
                                                >
                                                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500">Must be at least 8 characters, containing uppercase, lowercase, numbers, and symbols.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={passwords.confirmPassword}
                                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                    className="bg-slate-900/50 border-slate-700 focus-visible:ring-emerald-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!passwords.confirmPassword}
                                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${!passwords.confirmPassword ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-300'}`}
                                                >
                                                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-slate-900/20 border-t border-slate-800 p-4">
                                        <Button type="submit" disabled={isChangingPassword || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto">
                                            {isChangingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        )}

                        {/* Notice for OAuth Users */}
                        {user.provider !== 'local' && (
                            <Card className="animate-fadeInUp bg-slate-900/40 border-slate-800 shadow-none border-dashed" style={{ animationDelay: '200ms' }}>
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                    <ShieldCheck className="h-8 w-8 text-blue-400" />
                                    <div>
                                        <h3 className="font-semibold text-slate-200">Account Managed Securely</h3>
                                        <p className="text-sm text-slate-400 max-w-sm mt-1">Your account uses {user.provider === 'google' ? 'Google' : 'Meta'} authentication. Password management is handled by your provider.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Side Panels */}
                    <div className="space-y-8">

                        {/* Connected Accounts */}
                        <Card className="animate-fadeInUp bg-card/60 backdrop-blur-xl border-slate-700/50 shadow-xl" style={{ animationDelay: '150ms' }}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                                    Sign-In Method
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${user.provider === 'google' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1 rounded-full">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    <path fill="none" d="M1 1h22v22H1z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">Google</span>
                                        </div>
                                        {user.provider === 'google' ? (
                                            <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">Connected</Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Not connected</span>
                                        )}
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${user.provider === 'local' ? 'bg-violet-500/10 border-violet-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-800 p-1 rounded-full">
                                                <Mail className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium">Email / Password</span>
                                        </div>
                                        {user.provider === 'local' ? (
                                            <Badge variant="outline" className="text-violet-400 border-violet-400/30 bg-violet-400/10">Connected</Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Not connected</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription Summary */}
                        <Card className="animate-fadeInUp bg-card/60 backdrop-blur-xl border-slate-700/50 shadow-xl" style={{ animationDelay: '250ms' }}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-amber-400" />
                                    Subscription
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Current Plan</span>
                                        <Badge variant={user.planType === 'PRO' ? 'default' : 'secondary'} className={user.planType === 'PRO' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30' : ''}>
                                            {user.planType}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Status</span>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            {user.subscriptionStatus === 'ACTIVE' ? (
                                                <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="text-emerald-400">Active</span></>
                                            ) : user.subscriptionStatus === 'CANCELED' ? (
                                                <><AlertCircle className="h-3.5 w-3.5 text-amber-400" /> <span className="text-amber-400">Canceled</span></>
                                            ) : user.planType === 'FREE' ? (
                                                <span className="text-slate-300">Active (Free)</span>
                                            ) : (
                                                <><AlertCircle className="h-3.5 w-3.5 text-red-400" /> <span className="text-red-400">{user.subscriptionStatus}</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-center text-slate-500 space-y-1">
                                    <p>Member since {formatDate(user.createdAt)}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800" onClick={() => router.push('/settings')}>
                                    Manage Subscription
                                </Button>
                            </CardFooter>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
