"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface QuitConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function QuitConfirmationModal({ isOpen, onClose, onConfirm }: QuitConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <DialogTitle className="text-center text-xl">Quit Interview?</DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        You are in the middle of your interview. Leaving now will end the session and your progress for this attempt will be lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex sm:justify-center gap-3 mt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-none"
                    >
                        Stay & Continue
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                    >
                        Yes, Quit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
