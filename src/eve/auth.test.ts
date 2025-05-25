import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Env as RealEnv } from './auth'; // Assuming Env is exported from auth.ts

// Dynamically import getESIAccessToken inside beforeEach after resetting modules
let getESIAccessToken: typeof import('./auth').getESIAccessToken;

// Mock environment variables
// Ensure this matches the Env type expected by getESIAccessToken
// If AuthEnv in api.ts is different, this mock should still align with what auth.ts needs.
const mockEnv: RealEnv = {
  ESI_CLIENT_ID: 'test_client_id',
  ESI_CLIENT_SECRET: 'test_client_secret',
  ESI_REFRESH_TOKEN: 'test_refresh_token',
  // These are not strictly needed by getESIAccessToken but might be part of a shared Env type
  // ESI_CORPORATION_ID: 'dummy_corp_id', 
  // DB: {} as any, // Dummy D1 binding
};

const EVE_TOKEN_URL = "https://login.eveonline.com/v2/oauth/token";

// Helper to mock successful fetch response
const mockFetchSuccess = (accessToken = 'new_access_token', expiresIn = 3600) => {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ access_token: accessToken, expires_in: expiresIn }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

// Helper to mock failed fetch response
const mockFetchFailure = (status = 400, body: any = { error: 'bad_request' }, contentType = 'application/json') => {
  return vi.fn().mockResolvedValue(
    new Response(contentType === 'application/json' ? JSON.stringify(body) : String(body), {
      status,
      headers: { 'Content-Type': contentType },
    })
  );
};

// Helper to mock network failure
const mockFetchNetworkError = (message = 'Network failure') => {
  return vi.fn().mockRejectedValue(new Error(message));
};

describe('getESIAccessToken', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>;

  beforeEach(async () => {
    vi.resetModules(); // Crucial for resetting module-level cache in auth.ts
    const authModule = await import('./auth'); // Re-import after reset
    getESIAccessToken = authModule.getESIAccessToken;
    
    // Spy on fetch before each test
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.useFakeTimers(); // Use fake timers for controlling time-based cache expiry
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restores original fetch and other spies
    vi.useRealTimers(); // Clean up fake timers
  });

  it('1. should fetch a new token if cache is empty (Successful Token Refresh)', async () => {
    fetchSpy.mockImplementation(mockFetchSuccess('token123', 1200)); // 1200 seconds = 20 minutes

    const token = await getESIAccessToken(mockEnv);

    expect(token).toBe('token123');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      EVE_TOKEN_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic '), // Basic auth with encoded creds
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': 'login.eveonline.com',
        }),
        body: expect.any(String), // Body is URLSearchParams, check its contents
      })
    );
    // Check body contents specifically
    const bodyParams = new URLSearchParams(fetchSpy.mock.calls[0][1]?.body as string);
    expect(bodyParams.get('grant_type')).toBe('refresh_token');
    expect(bodyParams.get('refresh_token')).toBe(mockEnv.ESI_REFRESH_TOKEN);

    // Verify cache is populated - by trying to get token again (should be cached)
    fetchSpy.mockClear(); // Clear call count
    const cachedToken = await getESIAccessToken(mockEnv);
    expect(cachedToken).toBe('token123');
    expect(fetchSpy).not.toHaveBeenCalled(); // Should not call fetch again
  });

  it('2. should use cached token if valid (Cache Hit)', async () => {
    // Prime the cache
    fetchSpy.mockImplementation(mockFetchSuccess('cachedTokenXYZ', 1200));
    await getESIAccessToken(mockEnv);
    
    // Second call, fetch should not be called again
    fetchSpy.mockClear(); 
    const token = await getESIAccessToken(mockEnv);
    
    expect(token).toBe('cachedTokenXYZ');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('3. should refresh token if cache is expired (Cache Expired)', async () => {
    const initialExpiresIn = 1200; // 20 minutes
    fetchSpy.mockImplementation(mockFetchSuccess('initialToken', initialExpiresIn));
    await getESIAccessToken(mockEnv); // Populate cache

    // Advance time to just past the token's expiry + 1 minute buffer (from auth.ts)
    // (initialExpiresIn * 1000 milliseconds) is the original expiry
    // Cache considers token valid if tokenExpiryTime > (currentTime + 60000)
    // So, advance time by (initialExpiresIn - 59 seconds) to make it just past expiry for refresh logic
    vi.advanceTimersByTime((initialExpiresIn - 59) * 1000); 

    // Setup for the second call (refresh)
    fetchSpy.mockClear();
    fetchSpy.mockImplementation(mockFetchSuccess('refreshedToken987', 3600));
    
    const token = await getESIAccessToken(mockEnv);
    expect(token).toBe('refreshedToken987');
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Fetch called again for refresh
  });

  it('4.1 should handle ESI error (e.g., 400 Bad Request) and throw', async () => {
    fetchSpy.mockImplementation(mockFetchFailure(400, { error: 'invalid_grant' }));

    await expect(getESIAccessToken(mockEnv)).rejects.toThrow(
      /Failed to refresh ESI access token: 400 Bad Request. Details: {"error":"invalid_grant"}/
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify cache is not populated/cleared - try to fetch again, should still fail or try to refetch
    fetchSpy.mockClear();
    fetchSpy.mockImplementation(mockFetchFailure(400, { error: 'invalid_grant_again' }));
    await expect(getESIAccessToken(mockEnv)).rejects.toThrow(
        /Failed to refresh ESI access token: 400 Bad Request. Details: {"error":"invalid_grant_again"}/
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Fetch was called again, cache was not used with bad data
  });

  it('4.2 should handle ESI error (e.g., 500 Internal Server Error) and throw', async () => {
    fetchSpy.mockImplementation(mockFetchFailure(500, 'Internal Server Error', 'text/plain'));
    
    await expect(getESIAccessToken(mockEnv)).rejects.toThrow(
        /Failed to refresh ESI access token: 500 Internal Server Error. Details: Internal Server Error/
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
  
  it('4.3 should handle malformed JSON success response from ESI', async () => {
    fetchSpy.mockImplementation(vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "This is not a token" }), { // Missing access_token/expires_in
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ));

    await expect(getESIAccessToken(mockEnv)).rejects.toThrow(
      /ESI token response did not include access_token or expires_in/
    );
  });


  it('5. should handle network failure and throw', async () => {
    fetchSpy.mockImplementation(mockFetchNetworkError('ECONNREFUSED'));

    await expect(getESIAccessToken(mockEnv)).rejects.toThrow(
      /An unexpected error occurred during ESI token refresh: Error: ECONNREFUSED/
    ); // Or just 'ECONNREFUSED' if the wrapper isn't there
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('6. should throw error if ESI credentials are not configured in env', async () => {
    const incompleteEnv: any = { ...mockEnv };
    delete incompleteEnv.ESI_REFRESH_TOKEN;

    // No fetch call should be made
    await expect(getESIAccessToken(incompleteEnv)).rejects.toThrow(
      "ESI credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) are not configured in the environment."
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
