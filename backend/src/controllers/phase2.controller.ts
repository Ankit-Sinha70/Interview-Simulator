import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { parseResumeText } from '../ai/resume.engine';
import { fetchGitHubRepos, generateGitHubSummary } from '../services/github.service';
import { evaluateATS } from '../ai/ats.engine';

/**
 * POST /api/phase2/linkedin-import
 * Imports experience/skills from LinkedIn profile text or PDF
 */
export async function linkedinImport(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        let rawText = '';
        const file = req.file;

        if (file) {
            if (file.mimetype === 'application/pdf') {
                try {
                    const { PDFParse } = require('pdf-parse');
                    const parser = new PDFParse({ data: file.buffer });
                    const pdfData = await parser.getText();
                    rawText = pdfData.text || '';
                } catch (pdfError: any) {
                    console.error('[LinkedIn PDF Parse Error]', pdfError);
                    return res.status(400).json({ success: false, error: `Failed to parse PDF: ${pdfError.message || pdfError}` });
                }
            } else if (file.mimetype === 'text/plain') {
                rawText = file.buffer.toString('utf-8');
            } else {
                return res.status(400).json({ success: false, error: 'Only PDF and TXT files are supported' });
            }
        } else if (req.body.rawText) {
            rawText = req.body.rawText;
        }

        if (!rawText || rawText.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Please provide LinkedIn text or upload a PDF' });
        }

        const parsedData = await parseResumeText(rawText);

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        user.parsedResume = {
            role: parsedData.role || user.parsedResume?.role || '',
            experienceYears: parsedData.experienceYears || user.parsedResume?.experienceYears || '',
            skills: Array.from(new Set([...(user.parsedResume?.skills || []), ...parsedData.skills])),
            technologies: Array.from(new Set([...(user.parsedResume?.technologies || []), ...parsedData.technologies])),
            projects: [...(user.parsedResume?.projects || []), ...parsedData.projects],
            experience: [...(user.parsedResume?.experience || []), ...parsedData.experience],
            rawText: rawText,
            updatedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'LinkedIn profile imported and merged successfully',
            data: user.parsedResume
        });
    } catch (error) {
        console.error('[linkedinImport Error]', error);
        next(error);
    }
}

/**
 * POST /api/phase2/github-analyze
 * Analyzes candidate public repositories via GitHub username
 */
export async function githubAnalyze(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { username } = req.body;
        if (!username || username.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'GitHub username is required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // 1. Fetch public repos
        const repos = await fetchGitHubRepos(username.trim());

        // 2. Generate summary with AI
        const githubAnalysis = await generateGitHubSummary(repos);

        // 3. Save to user model
        user.githubProfile = {
            username: username.trim(),
            repos: repos.map(r => ({
                name: r.name,
                description: r.description || undefined,
                language: r.language || undefined,
                stars: r.stargazers_count
            })),
            summary: githubAnalysis.summary,
            detectedTechnologies: githubAnalysis.detectedTechnologies,
            topRepositories: githubAnalysis.topRepositories,
            strongestAreas: githubAnalysis.strongestAreas,
            moderateAreas: githubAnalysis.moderateAreas,
            weakAreas: githubAnalysis.weakAreas,
            analyzedAt: new Date()
        };

        // Also merge languages/skills into technologies/skills if any are identified
        const newLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean) as string[]));
        if (newLanguages.length > 0) {
            user.parsedResume = {
                role: user.parsedResume?.role || '',
                experienceYears: user.parsedResume?.experienceYears || '',
                skills: user.parsedResume?.skills || [],
                technologies: Array.from(new Set([...(user.parsedResume?.technologies || []), ...newLanguages])),
                projects: user.parsedResume?.projects || [],
                experience: user.parsedResume?.experience || [],
                rawText: user.parsedResume?.rawText || '',
                updatedAt: new Date()
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'GitHub profile analyzed successfully',
            data: user.githubProfile
        });
    } catch (error: any) {
        console.error('[githubAnalyze Error]', error);
        res.status(400).json({ success: false, error: error.message || 'Failed to analyze GitHub profile' });
    }
}

/**
 * POST /api/phase2/ats-evaluate
 * Computes match percentage and recommendation relative to job description
 */
export async function atsEvaluate(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { jobDescription, title, company } = req.body;
        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Job description is required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Evaluate using ATS engine
        const atsResult = await evaluateATS({
            resume: user.parsedResume,
            githubProfile: user.githubProfile,
            jobDescription: jobDescription.trim()
        });

        // Save target job description details
        user.targetJobDescription = {
            title: title || '',
            company: company || '',
            rawText: jobDescription.trim()
        };

        // Save ATS score results
        user.atsScore = {
            score: atsResult.score,
            resumeMatchScore: atsResult.resumeMatchScore,
            githubMatchScore: atsResult.githubMatchScore,
            overallMatchScore: atsResult.overallMatchScore,
            breakdown: atsResult.breakdown,
            hiringReadiness: atsResult.hiringReadiness,
            matchedSkills: atsResult.matchedSkills,
            missingSkills: atsResult.missingSkills,
            candidateStrengths: atsResult.candidateStrengths,
            potentialRiskAreas: atsResult.potentialRiskAreas,
            githubValidationScore: atsResult.githubValidationScore,
            suggestions: atsResult.suggestions,
            updatedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'ATS evaluation completed successfully',
            data: {
                targetJobDescription: user.targetJobDescription,
                atsScore: user.atsScore
            }
        });
    } catch (error) {
        console.error('[atsEvaluate Error]', error);
        next(error);
    }
}
