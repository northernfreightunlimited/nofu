// src/eve/auth.ts
// Handles simplified ESI authentication using a refresh token and in-memory caching.

/**
 * Interface for Cloudflare Worker environment variables.
 * These secrets must be configured in your Worker settings.
 */
export interface Env {
    ESI_CLIENT_ID: string;
    ESI_CLIENT_SECRET: string;
    ESI_REFRESH_TOKEN: string;
    // ESI_CORPORATION_ID: string; // This will be used in api.ts or other modules
    // DB: D1Database; // This will be used in cron.ts or other modules
}

// --- Constants ---
const EVE_TOKEN_URL = "https://login.eveonline.com/v2/oauth/token";

// --- In-memory Cache Variables ---
// These variables will store the access token and its expiry time in memory
// to reduce the number of calls to the ESI token endpoint.
// Note: This cache is per instance of the worker. If you have many instances,
// each will maintain its own cache. For a distributed cache, consider KV store.
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null; // Stores expiry time as a Unix timestamp (milliseconds)

/**
 * Encodes Client ID and Client Secret for Basic Authentication.
 * @param clientId - The ESI application client ID.
 * @param clientSecret - The ESI application client secret.
 * @returns A base64 encoded string for the Authorization header.
 */
function encodeBasicAuth(clientId: string, clientSecret: string): string {
    const combined = `${clientId}:${clientSecret}`;
    // In Node.js environments, Buffer is available.
    // In Cloudflare Workers, btoa is globally available for base64 encoding.
    if (typeof Buffer !== 'undefined') {
        return `Basic ${Buffer.from(combined).toString('base64')}`;
    } else if (typeof btoa !== 'undefined') {
        return `Basic ${btoa(combined)}`;
    } else {
        throw new Error("Base64 encoding function (Buffer or btoa) not available.");
    }
}

/**
 * Retrieves an ESI access token, using a cached token if available and valid,
 * otherwise refreshing it using the configured ESI_REFRESH_TOKEN.
 *
 * @param env - The Cloudflare Worker environment containing ESI credentials.
 * @returns A promise that resolves to a valid ESI access token.
 * @throws Error if token refresh fails or if credentials are not set.
 */
export async function getESIAccessToken(env: Env): Promise<string> {
    const { ESI_CLIENT_ID, ESI_CLIENT_SECRET, ESI_REFRESH_TOKEN } = env;

    if (!ESI_CLIENT_ID || !ESI_CLIENT_SECRET || !ESI_REFRESH_TOKEN) {
        throw new Error("ESI credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) are not configured in the environment.");
    }

    // Cache Check:
    // Check if a token is cached and if it's still valid (with a 1-minute buffer).
    const currentTime = Date.now();
    if (cachedAccessToken && tokenExpiryTime && tokenExpiryTime > (currentTime + 60000)) {
        // console.log("Returning cached ESI access token."); // For debugging
        return cachedAccessToken;
    }

    // console.log("No valid cached token. Refreshing ESI access token..."); // For debugging

    // If no valid cached token, proceed to refresh.
    const requestBody = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: ESI_REFRESH_TOKEN,
    });

    const authHeader = encodeBasicAuth(ESI_CLIENT_ID, ESI_CLIENT_SECRET);

    try {
        const response = await fetch(EVE_TOKEN_URL, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "login.eveonline.com", // As per ESI documentation requirements
            },
            body: requestBody.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Clear cache on failure to prevent using a potentially stale/invalid token
            cachedAccessToken = null;
            tokenExpiryTime = null;
            throw new Error(`Failed to refresh ESI access token: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const tokenData = await response.json();

        if (!tokenData.access_token || !tokenData.expires_in) {
            // Clear cache if response is malformed
            cachedAccessToken = null;
            tokenExpiryTime = null;
            throw new Error("ESI token response did not include access_token or expires_in.");
        }

        // Store the new token and its expiry time in the cache.
        cachedAccessToken = tokenData.access_token;
        // expires_in is in seconds, convert to milliseconds for Date.now() comparison.
        tokenExpiryTime = Date.now() + (tokenData.expires_in * 1000);

        // console.log("ESI access token refreshed and cached successfully."); // For debugging
        return cachedAccessToken;

    } catch (error) {
        // Clear cache on any error during fetch/processing
        cachedAccessToken = null;
        tokenExpiryTime = null;
        // Re-throw the error to be handled by the caller
        if (error instanceof Error) { // Check if it's already an Error object
             throw error;
        }
        throw new Error(`An unexpected error occurred during ESI token refresh: ${String(error)}`);
    }
}

// Ensure no old SSO login flow code (redirects, callback handlers, D1 token storage) remains.
// This file is now solely focused on obtaining an access token using a refresh token.
