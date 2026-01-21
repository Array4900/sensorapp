// token blacklist utilita
// znehodnoti JWT token pridanim na blacklist
// pouziva sa pri logout operacii aby sa zabranilo dalsiemu pouzivaniu tokenu

interface BlacklistedToken {
    token: string;
    expiresAt: number;
}

// mapa na ukladanie znehodnotenych tokenov
const blacklistedTokens: Map<string, BlacklistedToken> = new Map();

/**
 * Add a token to the blacklist
 * @param token - The JWT token to blacklist
 * @param expiresAt - Token expiration timestamp (in seconds)
 */
export function blacklistToken(token: string, expiresAt: number): void {
    blacklistedTokens.set(token, {
        token,
        expiresAt: expiresAt * 1000 // Convert to milliseconds
    });
    
    // naplanuj vycistenie tohto tokenu po jeho expiracii
    const timeUntilExpiry = (expiresAt * 1000) - Date.now();
    if (timeUntilExpiry > 0) {
        setTimeout(() => {
            blacklistedTokens.delete(token);
        }, timeUntilExpiry);
    }
}

/**
 * Check if a token is blacklisted
 * @param token - The JWT token to check
 * @returns true if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
    const blacklisted = blacklistedTokens.get(token);
    
    if (!blacklisted) {
        return false;
    }
    
    // Ak token expiroval, odstrani ho z blacklistu
    if (Date.now() > blacklisted.expiresAt) {
        blacklistedTokens.delete(token);
        return false;
    }
    
    return true;
}


// tokeny expirujuce po case sa z blacklistu automaticky odmazu
export function cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of blacklistedTokens.entries()) {
        if (now > data.expiresAt) {
            blacklistedTokens.delete(token);
        }
    }
}

// kazdu hodinu vycisti expirovane tokeny z blacklistu
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
