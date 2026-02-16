import React from "react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
    status: "focused" | "distracted" | "loading";
    children: React.ReactNode;
    className?: string;
}

export function StatusIndicator({ status, children, className }: StatusIndicatorProps) {
    const getBorderColor = () => {
        switch (status) {
            case "focused":
                return "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
            case "distracted":
                return "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
            case "loading":
                return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
            default:
                return "border-gray-500";
        }
    };

    return (
        <div className={cn(
            "relative rounded-lg overflow-hidden border-4 transition-all duration-300",
            getBorderColor(),
            className
        )}>
            {children}

            {/* Status Badge */}
            <div className={cn(
                "absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm",
                status === "focused" ? "bg-green-500/80" :
                    status === "distracted" ? "bg-red-500/80" :
                        "bg-yellow-500/80"
            )}>
                {status}
            </div>
        </div>
    );
}
