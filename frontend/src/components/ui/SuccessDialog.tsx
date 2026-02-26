import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SuccessDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    buttonText: string;
    onConfirm: () => void;
}

export function SuccessDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    buttonText,
    onConfirm,
}: SuccessDialogProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
        } else {
            setTimeout(() => setShow(false), 300); // Wait for transition
        }
    }, [isOpen]);

    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'}`}
            style={{ backgroundColor: 'rgba(11, 8, 22, 0.8)' }}
        >
            <div
                className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#120f22] p-8 text-center shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
            >
                {/* Decorative elements */}
                <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#6d5ae6]/20 blur-[50px]" />
                <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-[#8877ff]/20 blur-[50px]" />

                {/* Checkmark Animation Container */}
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#6d5ae6]/10 border border-[#6d5ae6]/20 relative">
                    <svg
                        className={`h-12 w-12 text-[#8877ff] transition-all duration-700 delay-100 ${isOpen ? 'scale-100 opacity-100 shadow-[0_0_20px_rgba(136,119,255,0.5)]' : 'scale-0 opacity-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                            className={`transition-all duration-700 ease-out delay-300 ${isOpen ? 'path-drawn' : 'path-hidden'}`}
                            style={{
                                strokeDasharray: 24,
                                strokeDashoffset: isOpen ? 0 : 24,
                                transition: 'stroke-dashoffset 0.6s ease-out 0.3s',
                            }}
                        />
                    </svg>
                </div>

                <h2 className="mb-3 text-2xl font-bold text-white tracking-tight">
                    {title}
                </h2>

                <p className="mb-8 text-slate-400 text-[15px] leading-relaxed">
                    {description}
                </p>

                <Button
                    onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                    }}
                    className="w-full h-12 text-[15px] font-semibold bg-[#6d5ae6] hover:bg-[#5b4ad1] text-white rounded-xl transition-all shadow-lg shadow-[#6d5ae6]/20"
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}
