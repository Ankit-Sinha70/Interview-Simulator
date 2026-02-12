import { VoiceMetadata } from '../models/interviewSession.model';

// ─── Filler Word Dictionary ───

const FILLER_WORDS = [
    'um', 'uh', 'uhh', 'umm', 'erm',
    'like', 'you know', 'basically', 'actually',
    'so', 'well', 'i mean', 'sort of', 'kind of',
    'right', 'okay so', 'literally',
];

/**
 * Count filler words in a text transcript
 */
export function countFillerWords(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;

    for (const filler of FILLER_WORDS) {
        // Use word-boundary matching for single words
        if (filler.includes(' ')) {
            // Multi-word fillers: count occurrences
            const regex = new RegExp(filler, 'gi');
            const matches = lower.match(regex);
            count += matches ? matches.length : 0;
        } else {
            // Single word fillers: match word boundaries
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = lower.match(regex);
            count += matches ? matches.length : 0;
        }
    }

    return count;
}

/**
 * Calculate words per minute from text and duration
 */
export function calculateWPM(text: string, durationSeconds: number): number {
    if (durationSeconds <= 0) return 0;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = durationSeconds / 60;
    return Math.round(wordCount / minutes);
}

/**
 * Estimate pause count from transcript text
 * Heuristic: count sequences of ... or long gaps indicated by punctuation patterns
 */
export function estimatePauseCount(text: string): number {
    const ellipses = (text.match(/\.{3,}/g) || []).length;
    const dashes = (text.match(/—|--|–/g) || []).length;
    return ellipses + dashes;
}

/**
 * Analyze voice metadata from a transcript and recording duration
 */
export function analyzeVoiceMetadata(text: string, durationSeconds: number): VoiceMetadata {
    return {
        durationSeconds: Math.round(durationSeconds * 100) / 100,
        fillerWordCount: countFillerWords(text),
        pauseCount: estimatePauseCount(text),
        wordsPerMinute: calculateWPM(text, durationSeconds),
    };
}

/**
 * Generate a voice confidence summary string for use in AI prompts
 */
export function getVoiceConfidenceSummary(meta: VoiceMetadata): string {
    const parts: string[] = [];

    // WPM analysis
    if (meta.wordsPerMinute < 80) {
        parts.push('Slow speaking pace (may indicate hesitation)');
    } else if (meta.wordsPerMinute > 180) {
        parts.push('Very fast speaking pace (may indicate nervousness)');
    } else {
        parts.push('Normal speaking pace');
    }

    // Filler words
    if (meta.fillerWordCount > 10) {
        parts.push(`High filler word usage (${meta.fillerWordCount} detected)`);
    } else if (meta.fillerWordCount > 4) {
        parts.push(`Moderate filler word usage (${meta.fillerWordCount} detected)`);
    } else {
        parts.push(`Low filler word usage (${meta.fillerWordCount} detected)`);
    }

    // Duration
    parts.push(`Response duration: ${meta.durationSeconds}s`);

    return parts.join('. ') + '.';
}
