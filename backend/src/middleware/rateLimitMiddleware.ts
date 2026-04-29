import rateLimit from 'express-rate-limit';

const standardHeaders = 'draft-8' as const;

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Príliš veľa pokusov o prihlásenie. Skúste znova neskôr.' }
});

export const authMutationRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders,
    legacyHeaders: false,
    message: { message: 'Príliš veľa požiadaviek. Skúste znova neskôr.' }
});

export const measurementIngestRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders,
    legacyHeaders: false,
    message: { message: 'Príliš veľa meraní z jednej adresy. Skúste znova neskôr.' }
});