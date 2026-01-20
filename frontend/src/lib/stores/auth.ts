/**
 * Authentication Store - Centralized auth state management
 * 
 * This module manages:
 * - User authentication state (login/logout)
 * - JWT token storage and verification
 * - Persistent sessions via localStorage
 * - Auth-related API calls
 * 
 * Uses Svelte 5 runes-compatible writable stores
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * User interface - represents authenticated user
 */
export interface User {
    _id?: string;
    id: string;
    username: string;
    email?: string;
    role: 'USER' | 'ADMIN';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Auth state interface - complete authentication state
 */
export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Registration data interface
 */
export interface RegisterData extends LoginCredentials {
    confirmPassword?: string;
}

/**
 * API response interfaces
 */
interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

interface ErrorResponse {
    message: string;
    errors?: string[];
}

// ============================================
// CONFIGURATION
// ============================================

// pouzi localhost pri neexistujucej env pre vyvoj
const API_BASE = env.PUBLIC_API_URL || 'http://localhost:5000/api';

/** LocalStorage keys */
const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'auth_user'
} as const;

// ============================================
// STORE INITIALIZATION
// ============================================

/**
 * Create initial auth state
 * Attempts to restore session from localStorage
 */
function createInitialState(): AuthState {
    // Only access localStorage in browser environment
    if (browser) {
        try {
            const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
            
            if (storedToken && storedUser) {
                const user = JSON.parse(storedUser) as User;
                return {
                    user,
                    token: storedToken,
                    isLoading: false,
                    error: null
                };
            }
        } catch (e) {
            // Clear corrupted data
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
        }
    }
    
    return {
        user: null,
        token: null,
        isLoading: false,
        error: null
    };
}

/**
 * Main authentication store
 * Writable store containing complete auth state
 */
const authStore: Writable<AuthState> = writable(createInitialState());

// ============================================
// DERIVED STORES
// ============================================

/**
 * Current user - derived store for easy access
 */
export const user: Readable<User | null> = derived(
    authStore,
    ($auth) => $auth.user
);

/**
 * Authentication status - true if user is logged in
 */
export const isAuthenticated: Readable<boolean> = derived(
    authStore,
    ($auth) => $auth.user !== null && $auth.token !== null
);

/**
 * Admin status - true if user has admin role
 */
export const isAdmin: Readable<boolean> = derived(
    authStore,
    ($auth) => $auth.user?.role === 'ADMIN'
);

/**
 * Loading status - true during API calls
 */
export const isLoading: Readable<boolean> = derived(
    authStore,
    ($auth) => $auth.isLoading
);

/**
 * Auth error message
 */
export const authError: Readable<string | null> = derived(
    authStore,
    ($auth) => $auth.error
);

/**
 * Auth token for API calls
 */
export const authToken: Readable<string | null> = derived(
    authStore,
    ($auth) => $auth.token
);

/**
 * Auth ready state - indicates initial auth check is complete
 */
export const authReady: Writable<boolean> = writable(false);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Persist auth data to localStorage
 */
function persistAuth(user: User, token: string): void {
    if (browser) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
}

/**
 * Clear auth data from localStorage
 */
function clearPersistedAuth(): void {
    if (browser) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }
}

/**
 * Make authenticated API request
 */
async function authFetch(
    endpoint: string, 
    options: RequestInit = {}
): Promise<Response> {
    let currentToken: string | null = null;
    
    // Get current token from store
    authStore.subscribe(state => {
        currentToken = state.token;
    })();
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    
    if (currentToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
}

// ============================================
// AUTH ACTIONS
// ============================================

/**
 * Login user with credentials
 * 
 * @param usernameOrCredentials - Username string or LoginCredentials object
 * @param password - Password (only if first param is string)
 * @returns Promise resolving to success boolean
 * @throws Error if login fails
 */
export async function login(
    usernameOrCredentials: string | LoginCredentials, 
    password?: string
): Promise<boolean> {
    // Handle both call signatures
    const credentials: LoginCredentials = typeof usernameOrCredentials === 'string'
        ? { username: usernameOrCredentials, password: password! }
        : usernameOrCredentials;
    
    authStore.update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            const errorData = data as ErrorResponse;
            const errorMessage = errorData.message || 'Login failed';
            authStore.update(state => ({
                ...state,
                isLoading: false,
                error: errorMessage
            }));
            throw new Error(errorMessage);
        }
        
        const authData = data as AuthResponse;
        
        // Update store and persist
        authStore.set({
            user: authData.user,
            token: authData.token,
            isLoading: false,
            error: null
        });
        
        persistAuth(authData.user, authData.token);
        
        return true;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
        authStore.update(state => ({
            ...state,
            isLoading: false,
            error: errorMessage
        }));
        throw error;
    }
}

/**
 * Register new user
 * 
 * @param usernameOrData - Username string or RegisterData object
 * @param password - Password (only if first param is string)
 * @returns Promise resolving to success boolean
 * @throws Error if registration fails
 */
export async function register(
    usernameOrData: string | RegisterData, 
    password?: string
): Promise<boolean> {
    // Handle both call signatures
    const data: { username: string; password: string } = typeof usernameOrData === 'string'
        ? { username: usernameOrData, password: password! }
        : { username: usernameOrData.username, password: usernameOrData.password };
    
    authStore.update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            const errorData = responseData as ErrorResponse;
            const errorMessage = errorData.errors?.join(', ') || errorData.message || 'Registration failed';
            authStore.update(state => ({
                ...state,
                isLoading: false,
                error: errorMessage
            }));
            throw new Error(errorMessage);
        }
        
        // Registration successful - user should login separately
        authStore.update(state => ({
            ...state,
            isLoading: false,
            error: null
        }));
        
        return true;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
        authStore.update(state => ({
            ...state,
            isLoading: false,
            error: errorMessage
        }));
        throw error;
    }
}

/**
 * Logout current user
 * Clears all auth state and persisted data
 */
export function logout(): void {
    authStore.set({
        user: null,
        token: null,
        isLoading: false,
        error: null
    });
    clearPersistedAuth();
}

/**
 * Change user password
 * 
 * @param oldPassword - Current password
 * @param newPassword - New password
 * @returns Promise resolving to success boolean
 */
export async function changePassword(
    oldPassword: string, 
    newPassword: string
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await authFetch('/auth/password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return { 
                success: false, 
                message: data.message || 'Failed to change password' 
            };
        }
        
        return { success: true, message: 'Password changed successfully' };
        
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

/**
 * Delete user account
 * 
 * @param password - Password for confirmation
 * @returns Promise resolving to success boolean
 */
export async function deleteAccount(password: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await authFetch('/auth/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return { 
                success: false, 
                message: data.message || 'Failed to delete account' 
            };
        }
        
        // Clear auth state after deletion
        logout();
        
        return { success: true, message: 'Account deleted successfully' };
        
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

/**
 * Verify current token with backend
 * Used on app initialization to validate stored session
 */
export async function verifyToken(): Promise<boolean> {
    // Get current state from store
    let currentState: AuthState = {
        user: null,
        token: null,
        isLoading: false,
        error: null
    };
    
    const unsubscribe = authStore.subscribe((state: AuthState) => { 
        currentState = state; 
    });
    unsubscribe();
    
    if (!currentState.token) {
        authReady.set(true);
        return false;
    }
    
    try {
        const response = await authFetch('/auth/verify', {
            method: 'POST'
        });
        
        if (!response.ok) {
            // Token invalid, clear auth
            logout();
            authReady.set(true);
            return false;
        }
        
        authReady.set(true);
        return true;
        
    } catch (error) {
        // Network error - keep current state but mark as ready
        authReady.set(true);
        return false;
    }
}

/**
 * Get current user from backend
 * Refreshes user data from server
 */
export async function refreshUser(): Promise<User | null> {
    try {
        const response = await authFetch('/auth/me');
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        if (data.user) {
            authStore.update(state => ({
                ...state,
                user: data.user
            }));
            
            if (browser) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
            }
            
            return data.user;
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Clear auth error
 */
export function clearError(): void {
    authStore.update(state => ({ ...state, error: null }));
}

// ============================================
// INITIALIZATION
// ============================================

// Verify token on app load (browser only)
if (browser) {
    verifyToken();
}

// ============================================
// EXPORTS
// ============================================

// Export the main store for direct subscription
export { authStore };

// Export auth fetch for use in other stores
export { authFetch };

// Default export for convenience
export default {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    authError,
    authToken,
    authReady,
    login,
    register,
    logout,
    changePassword,
    deleteAccount,
    verifyToken,
    refreshUser,
    clearError,
    authFetch
};
