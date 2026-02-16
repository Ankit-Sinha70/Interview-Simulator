export interface AttentionStats {
    focusScore: number; // 0-100
    totalLookAwayTime: number; // seconds
    longestLookAway: number; // seconds
    distractionEvents: number; // count
    focusCategory: "Excellent" | "Good" | "Moderate" | "Low";
}

export class AttentionEngine {
    private totalFrames: number = 0;
    private focusedFrames: number = 0;
    private lookAwayFrames: number = 0;

    private currentLookAwaySequence: number = 0;
    private longestLookAwaySequence: number = 0;

    private distractionEvents: number = 0;
    private isCurrentlyDistracted: boolean = false;

    private readonly FPS = 30; // Assumed FPS for time calc

    update(isFocused: boolean) {
        this.totalFrames++;

        if (isFocused) {
            this.focusedFrames++;

            if (this.isCurrentlyDistracted) {
                // Just returned from distraction
                this.longestLookAwaySequence = Math.max(
                    this.longestLookAwaySequence,
                    this.currentLookAwaySequence
                );
                this.currentLookAwaySequence = 0;
                this.isCurrentlyDistracted = false;
            }
        } else {
            this.lookAwayFrames++;
            this.currentLookAwaySequence++;

            // If looked away for more than 1 second (30 frames), count as event
            if (!this.isCurrentlyDistracted && this.currentLookAwaySequence > this.FPS) {
                this.distractionEvents++;
                this.isCurrentlyDistracted = true;
            }
        }
    }

    getStats(): AttentionStats {
        const focusScore = this.totalFrames === 0 ? 100 : Math.round((this.focusedFrames / this.totalFrames) * 100);
        const totalLookAwayTime = this.lookAwayFrames / this.FPS;
        const longestLookAway = (Math.max(this.longestLookAwaySequence, this.currentLookAwaySequence)) / this.FPS;

        let focusCategory: AttentionStats["focusCategory"] = "Excellent";
        if (focusScore < 60) focusCategory = "Low";
        else if (focusScore < 75) focusCategory = "Moderate";
        else if (focusScore < 90) focusCategory = "Good";

        return {
            focusScore,
            totalLookAwayTime: parseFloat(totalLookAwayTime.toFixed(1)),
            longestLookAway: parseFloat(longestLookAway.toFixed(1)),
            distractionEvents: this.distractionEvents,
            focusCategory
        };
    }

    reset() {
        this.totalFrames = 0;
        this.focusedFrames = 0;
        this.lookAwayFrames = 0;
        this.currentLookAwaySequence = 0;
        this.longestLookAwaySequence = 0;
        this.distractionEvents = 0;
        this.isCurrentlyDistracted = false;
    }
}
