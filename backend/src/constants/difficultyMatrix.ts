import { ExperienceLevel, Difficulty } from '../models/interviewSession.model';

// ─── Difficulty Band ───

export interface DifficultyBand {
    min: number; // 1-10 scale
    max: number;
}

// ─── Level Configuration ───

export interface LevelConfig {
    allowedDifficulty: Difficulty[];
    difficultyBand: DifficultyBand;
    maxConceptDepth: number;
    allowedTopics: Record<string, string[]>; // role -> topics
    forbiddenTopics: Record<string, string[]>; // role -> forbidden topics
}

// ─── Topic Buckets per Role ───

const FRONTEND_TOPICS = {
    junior: [
        'HTML basics', 'CSS fundamentals', 'CSS box model', 'CSS flexbox',
        'JavaScript basics', 'Variables and data types', 'Functions and scope',
        'DOM manipulation', 'Event handling', 'Arrays and loops',
        'Simple React components', 'JSX syntax', 'React useState', 'React useEffect',
        'Basic form handling', 'Conditional rendering', 'Lists and keys',
        'Basic responsive design', 'CSS media queries', 'Git basics',
    ],
    mid: [
        'React hooks (advanced)', 'Custom hooks', 'Context API', 'State management basics',
        'React Router', 'Component patterns', 'Error boundaries', 'React lifecycle',
        'CSS Grid', 'CSS animations', 'Sass/SCSS', 'CSS modules',
        'REST API integration', 'Async/await', 'Promises', 'Error handling',
        'TypeScript basics', 'Unit testing basics', 'Webpack basics',
        'Accessibility fundamentals', 'Performance basics', 'Code splitting',
        'Design patterns (basic)', 'Authentication flows', 'Form validation libraries',
    ],
    senior: [
        'System design', 'Scalability', 'Performance optimization',
        'SSR vs CSR tradeoffs', 'Next.js architecture', 'Microfrontends',
        'State architecture patterns', 'Redux internals', 'Rendering optimization',
        'Virtual DOM internals', 'Reconciliation algorithm', 'Fiber architecture',
        'Build tool optimization', 'Bundle analysis', 'Tree shaking internals',
        'Design system architecture', 'Monorepo strategies', 'CI/CD for frontend',
        'Web security (XSS, CSRF)', 'Service workers', 'Progressive web apps',
        'WebSocket architecture', 'GraphQL architecture', 'Testing strategy',
        'Technical leadership', 'Code review practices', 'Team mentoring',
    ],
};

const BACKEND_TOPICS = {
    junior: [
        'HTTP basics', 'REST API fundamentals', 'HTTP methods', 'Status codes',
        'Express.js basics', 'Routing', 'Middleware basics', 'Request/Response cycle',
        'JSON handling', 'CRUD operations', 'Basic database queries',
        'MongoDB basics', 'SQL basics', 'Environment variables',
        'Error handling basics', 'Async/await basics', 'Node.js fundamentals',
        'npm basics', 'File system operations', 'Basic authentication',
    ],
    mid: [
        'Database design', 'Indexing strategies', 'Query optimization',
        'Authentication (JWT, OAuth)', 'Authorization patterns', 'Session management',
        'Middleware patterns', 'Input validation', 'Error handling patterns',
        'API versioning', 'Pagination', 'Rate limiting',
        'Caching basics (Redis)', 'Message queues basics', 'Docker basics',
        'Unit testing', 'Integration testing', 'TypeScript',
        'ORM usage (Mongoose, Prisma)', 'Logging and monitoring',
        'Design patterns', 'SOLID principles', 'Clean architecture basics',
    ],
    senior: [
        'System design', 'Microservices architecture', 'Event-driven architecture',
        'Database scaling', 'Sharding strategies', 'Replication',
        'Distributed systems', 'CAP theorem', 'Consistency patterns',
        'High availability', 'Load balancing', 'Service mesh',
        'CQRS pattern', 'Event sourcing', 'Domain-driven design',
        'API gateway patterns', 'gRPC', 'Message broker architecture',
        'Kubernetes orchestration', 'Cloud architecture (AWS/GCP)',
        'Security architecture', 'Zero trust', 'DevSecOps',
        'Performance profiling', 'Observability', 'SRE practices',
        'Technical leadership', 'Architecture decision records',
    ],
};

const FULLSTACK_TOPICS = {
    junior: [
        ...FRONTEND_TOPICS.junior.slice(0, 12),
        ...BACKEND_TOPICS.junior.slice(0, 12),
    ],
    mid: [
        ...FRONTEND_TOPICS.mid.slice(0, 14),
        ...BACKEND_TOPICS.mid.slice(0, 14),
    ],
    senior: [
        ...FRONTEND_TOPICS.senior.slice(0, 14),
        ...BACKEND_TOPICS.senior.slice(0, 14),
    ],
};

const GENERIC_TOPICS = {
    junior: [
        'Programming basics', 'Data types', 'Functions', 'Loops and conditionals',
        'Basic algorithms', 'Simple data structures', 'Version control basics',
        'Debugging basics', 'Code readability', 'Basic testing',
    ],
    mid: [
        'Design patterns', 'SOLID principles', 'Testing strategies',
        'Code architecture', 'Performance basics', 'API design',
        'Database design', 'Security basics', 'CI/CD basics',
    ],
    senior: [
        'System design', 'Architecture patterns', 'Scalability',
        'Leadership', 'Technical strategy', 'Performance optimization',
        'Security architecture', 'Cloud architecture', 'Team management',
    ],
};

// ─── Forbidden Topics (Cross-Level Leakage Prevention) ───

const FORBIDDEN_TOPICS: Record<string, Record<string, string[]>> = {
    'Frontend Developer': {
        junior: [
            'system design', 'microservices', 'microfrontends', 'SSR vs CSR tradeoffs',
            'rendering optimization', 'virtual DOM internals', 'fiber architecture',
            'scalability', 'architecture patterns', 'performance profiling',
            'build tool optimization', 'monorepo strategies', 'design system architecture',
        ],
        mid: [
            'fiber architecture', 'reconciliation algorithm', 'microfrontends',
            'monorepo strategies', 'technical leadership',
        ],
        senior: [],
    },
    'Backend Developer': {
        junior: [
            'system design', 'microservices', 'distributed systems', 'CQRS',
            'event sourcing', 'domain-driven design', 'sharding', 'replication',
            'service mesh', 'kubernetes', 'cloud architecture',
            'scalability', 'high availability', 'load balancing',
        ],
        mid: [
            'service mesh', 'CQRS', 'event sourcing', 'domain-driven design',
            'kubernetes orchestration', 'zero trust',
        ],
        senior: [],
    },
    'Fullstack Developer': {
        junior: [
            'system design', 'microservices', 'microfrontends', 'distributed systems',
            'scalability', 'architecture patterns', 'performance profiling',
            'sharding', 'replication', 'event sourcing', 'CQRS',
        ],
        mid: [
            'microfrontends', 'fiber architecture', 'service mesh',
            'CQRS', 'event sourcing', 'domain-driven design',
        ],
        senior: [],
    },
};

// ─── Difficulty Matrix ───

export const DIFFICULTY_MATRIX: Record<ExperienceLevel, LevelConfig> = {
    Junior: {
        allowedDifficulty: ['easy'],
        difficultyBand: { min: 1, max: 3 },
        maxConceptDepth: 3,
        allowedTopics: {
            'Frontend Developer': FRONTEND_TOPICS.junior,
            'Backend Developer': BACKEND_TOPICS.junior,
            'Fullstack Developer': FULLSTACK_TOPICS.junior,
            '_default': GENERIC_TOPICS.junior,
        },
        forbiddenTopics: {
            'Frontend Developer': FORBIDDEN_TOPICS['Frontend Developer'].junior,
            'Backend Developer': FORBIDDEN_TOPICS['Backend Developer'].junior,
            'Fullstack Developer': FORBIDDEN_TOPICS['Fullstack Developer'].junior,
            '_default': ['system design', 'scalability', 'architecture patterns', 'distributed systems'],
        },
    },
    Mid: {
        allowedDifficulty: ['easy', 'medium'],
        difficultyBand: { min: 3, max: 7 },
        maxConceptDepth: 6,
        allowedTopics: {
            'Frontend Developer': FRONTEND_TOPICS.mid,
            'Backend Developer': BACKEND_TOPICS.mid,
            'Fullstack Developer': FULLSTACK_TOPICS.mid,
            '_default': GENERIC_TOPICS.mid,
        },
        forbiddenTopics: {
            'Frontend Developer': FORBIDDEN_TOPICS['Frontend Developer'].mid,
            'Backend Developer': FORBIDDEN_TOPICS['Backend Developer'].mid,
            'Fullstack Developer': FORBIDDEN_TOPICS['Fullstack Developer'].mid,
            '_default': ['fiber architecture', 'CQRS', 'event sourcing'],
        },
    },
    Senior: {
        allowedDifficulty: ['medium', 'hard'],
        difficultyBand: { min: 6, max: 10 },
        maxConceptDepth: 10,
        allowedTopics: {
            'Frontend Developer': FRONTEND_TOPICS.senior,
            'Backend Developer': BACKEND_TOPICS.senior,
            'Fullstack Developer': FULLSTACK_TOPICS.senior,
            '_default': GENERIC_TOPICS.senior,
        },
        forbiddenTopics: {
            'Frontend Developer': FORBIDDEN_TOPICS['Frontend Developer'].senior,
            'Backend Developer': FORBIDDEN_TOPICS['Backend Developer'].senior,
            'Fullstack Developer': FORBIDDEN_TOPICS['Fullstack Developer'].senior,
            '_default': [],
        },
    },
};

// ─── Helper Functions ───

/**
 * Get the level config for a given experience level
 */
export function getLevelConfig(level: ExperienceLevel): LevelConfig {
    return DIFFICULTY_MATRIX[level];
}

/**
 * Get allowed topics for a role + level combination
 */
export function getAllowedTopics(role: string, level: ExperienceLevel): string[] {
    const config = DIFFICULTY_MATRIX[level];
    return config.allowedTopics[role] || config.allowedTopics['_default'];
}

/**
 * Get forbidden topics for a role + level combination
 */
export function getForbiddenTopics(role: string, level: ExperienceLevel): string[] {
    const config = DIFFICULTY_MATRIX[level];
    return config.forbiddenTopics[role] || config.forbiddenTopics['_default'];
}

/**
 * Get the difficulty band for a given level
 */
export function getDifficultyBand(level: ExperienceLevel): DifficultyBand {
    return DIFFICULTY_MATRIX[level].difficultyBand;
}

/**
 * Check if a difficulty is allowed for a given level
 */
export function isDifficultyAllowed(difficulty: Difficulty, level: ExperienceLevel): boolean {
    return DIFFICULTY_MATRIX[level].allowedDifficulty.includes(difficulty);
}

/**
 * Clamp a difficulty to the allowed range for a level
 */
export function clampDifficulty(difficulty: Difficulty, level: ExperienceLevel): Difficulty {
    const allowed = DIFFICULTY_MATRIX[level].allowedDifficulty;
    if (allowed.includes(difficulty)) return difficulty;

    // Map to index for comparison
    const diffOrder: Difficulty[] = ['easy', 'medium', 'hard'];
    const diffIdx = diffOrder.indexOf(difficulty);
    const allowedIndices = allowed.map(d => diffOrder.indexOf(d));
    const minAllowed = Math.min(...allowedIndices);
    const maxAllowed = Math.max(...allowedIndices);

    if (diffIdx < minAllowed) return diffOrder[minAllowed];
    if (diffIdx > maxAllowed) return diffOrder[maxAllowed];
    return allowed[0]; // fallback
}
