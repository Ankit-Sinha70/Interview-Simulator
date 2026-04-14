'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Dynamic Mesh Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-destructive/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[90px]" />
            </div>

            <div className="w-full max-w-5xl mx-auto relative z-10">
                <Card className="bg-card/90 backdrop-blur-2xl border border-border/70 shadow-xl overflow-hidden rounded-3xl grid grid-cols-1 md:grid-cols-2 animate-fade-in-up">

                    {/* Left Side: Illustration */}
                    <div className="hidden md:flex flex-col justify-center items-center bg-muted/20 p-12 order-2 md:order-1 border-t md:border-t-0 md:border-r border-dashed border-border/60 relative">
                        {/* Cutout Effects - Now on the dividing line between columns */}
                        <div className="hidden md:block absolute top-0 -right-4 w-8 h-8 bg-background rounded-full -translate-y-1/2 z-20" />
                        <div className="hidden md:block absolute bottom-0 -right-4 w-8 h-8 bg-background rounded-full translate-y-1/2 z-20" />

                        <img
                            src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                            alt="Canceled Checkout"
                            className="w-full max-w-[320px] drop-shadow-2xl opacity-90 hover:scale-105 transition-transform duration-700"
                            style={{ filter: "drop-shadow(0px 20px 40px rgba(70, 238, 157, 1))", transform: "scaleX(-1)" }}
                        />
                    </div>

                    {/* Right Side: Ticket Receipt */}
                    <div className="relative flex flex-col justify-center p-8 md:p-12 order-1 md:order-2">
                        <div className="text-center mb-10 pb-8 border-b border-dashed border-border/60">
                            <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-2 ring-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-zoom-in">
                                <span className="text-4xl">⚠️</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
                                Payment Canceled
                            </h2>
                            <p className="text-muted-foreground text-sm tracking-wider uppercase font-medium">
                                Status: <span className="text-foreground/80 font-mono">INCOMPLETE</span>
                            </p>
                        </div>

                        <div className="bg-background/70 p-6 rounded-2xl border border-border/60">
                            <p className="text-muted-foreground text-sm text-center mb-8 leading-relaxed">
                                You have canceled the checkout process. No charges were made to your account. You will remain on the Free plan.
                            </p>

                            <div className="space-y-4 w-full">
                                <Link href="/pricing" className="w-full">
                                    <Button className="w-full bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/90 text-white font-bold h-10 rounded-xl transition-all shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] text-lg">
                                        <RefreshCcw className="w-5 h-5 mr-3" /> Try Upgrade Again
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => router.push('/')}
                                    variant="outline"
                                    className="w-full h-10 rounded-xl border-border text-foreground hover:bg-accent hover:text-foreground font-bold text-base transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-3" /> Back to Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>

                </Card>
            </div>
        </div>
    );
}
