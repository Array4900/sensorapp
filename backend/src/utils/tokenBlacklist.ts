// token blacklist utilita
// znehodnoti JWT token pridanim na blacklist v MongoDB
// pouziva sa pri logout operacii aby sa zabranilo dalsiemu pouzivaniu tokenu

import BlacklistedToken from '../models/BlacklistedToken.js';

/**
 * Add a token to the blacklist
 * @param token - The JWT token to blacklist
 * @param expiresAt - Token expiration timestamp (in seconds)
 */
export async function blacklistToken(token: string, expiresAt: number): Promise<void> {
    try {
        await BlacklistedToken.create({
            token,
            expiresAt: new Date(expiresAt * 1000)
        });
    } catch (err: any) {
        // Ignoruj duplicitné tokeny
        if (err.code !== 11000) {
            console.error('Chyba pri blacklistovaní tokenu:', err);
        }
    }
}

/**
 * Check if a token is blacklisted
 * @param token - The JWT token to check
 * @returns true if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await BlacklistedToken.findOne({ token });
    return !!blacklisted;
}

/**
 * Vyčistí expirovane tokeny z blacklistu
 * MongoDB TTL index to robí automaticky, ale toto je záložné čistenie
 */
export async function cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await BlacklistedToken.deleteMany({ expiresAt: { $lt: now } });
    if (result.deletedCount > 0) {
        console.log(`Vyčistených ${result.deletedCount} expirovaných tokenov z blacklistu.`);
    }
}

/**
 * Spustí pravidelné čistenie expirovaných tokenov
 * Volá sa pri štarte servera
 */
export function startTokenCleanupScheduler(): void {
    // Vyčisti pri štarte
    cleanupExpiredTokens().catch(err => console.error('Chyba pri počiatočnom čistení tokenov:', err));
    
    // Potom každých 30 minút
    setInterval(() => {
        cleanupExpiredTokens().catch(err => console.error('Chyba pri čistení tokenov:', err));
    }, 30 * 60 * 1000);
}
