import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCorporationContracts } from './api'; // Adjust path if necessary, assuming it's in the same directory for testing
import type { Env as ApiEnv, Contract } from './api';
import type { Env as AuthEnv } from './auth'; // Assuming auth.ts exports its Env type

// Mock ./auth.ts
// This effectively replaces the actual './auth' module with our mock for this test file.
vi.mock('./auth', () => ({
  getESIAccessToken: vi.fn(), // Mocking the function directly
}));

// Now we can import the mocked function
import { getESIAccessToken } from './auth';

// Mock environment
// Combine Env types. For this test, api.ts's Env is the primary, but auth's needs are covered by the mock.
const mockApiEnv: ApiEnv & Partial<AuthEnv> = { // Using Partial<AuthEnv> as getESIAccessToken is mocked
  ESI_CORPORATION_ID: 'mock_corp_id_98765',
  // These are not strictly used by fetchCorporationContracts directly if getESIAccessToken is mocked,
  // but good to have for completeness if the mock was more complex or for type safety.
  ESI_CLIENT_ID: 'dummy_client_id_for_auth_env',
  ESI_CLIENT_SECRET: 'dummy_client_secret_for_auth_env',
  ESI_REFRESH_TOKEN: 'dummy_refresh_token_for_auth_env',
};

const ESI_BASE_URL = "https://esi.evetech.net/latest";
const DATASOURCE = "tranquility";

// Example ESI contract data generator
const mockEsiContract = (id: number, type = 'courier', status = 'outstanding', overrides: Partial<any> = {}) => ({
  contract_id: id,
  type,
  status,
  issuer_id: 1000 + id,
  issuer_corporation_id: 2000 + id, // ESI field name, updated
  assignee_id: 0, // Can be a corporation or character ID
  acceptor_id: 0, // Character ID
  start_location_id: 60003760, // Jita IV Moon 4 - Caldari Trade Hub
  end_location_id: 60008494,   // Amarr VIII (Oris) - Emperor Family Academy
  reward: 100000 * id,
  collateral: 500000 * id,
  volume: 100 * id,
  date_issued: new Date(Date.now() - 86400000 * 2).toISOString(), // Issued 2 days ago
  date_expired: new Date(Date.now() + 86400000 * 5).toISOString(), // Expires in 5 days
  date_accepted: null,
  date_completed: null,
  days_to_complete: 7,
  title: `Test Courier Contract ${id}`,
  ...overrides,
});

describe('fetchCorporationContracts', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>;

  beforeEach(() => {
    // Reset all mocks before each test, including the mock for getESIAccessToken and fetch.
    vi.resetAllMocks(); 
    // Spy on the global fetch function
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    // Restore all mocks to their original state after each test
    vi.restoreAllMocks();
  });

  it('1. should fetch, filter, and map outstanding courier contracts correctly', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_esi_access_token');
    const mockContractsResponse = [
      mockEsiContract(1, 'courier', 'outstanding'),
      mockEsiContract(2, 'item_exchange', 'outstanding'), // Should be filtered out (wrong type)
      mockEsiContract(3, 'courier', 'in_progress'),     // Should be filtered out (wrong status)
      mockEsiContract(4, 'courier', 'outstanding'),
      mockEsiContract(5, 'auction', 'outstanding'),     // Should be filtered out (wrong type)
    ];
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockContractsResponse), { status: 200 }));

    const contracts = await fetchCorporationContracts(mockApiEnv);

    expect(getESIAccessToken).toHaveBeenCalledWith(mockApiEnv);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const expectedUrl = `${ESI_BASE_URL}/corporations/${mockApiEnv.ESI_CORPORATION_ID}/contracts/?datasource=${DATASOURCE}&page=1`;
    expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 
        'Authorization': 'Bearer mock_esi_access_token',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }));
    
    expect(contracts).toHaveLength(2);
    expect(contracts[0].contract_id).toBe(1);
    expect(contracts[0].issuer_corporation_id).toBe(2001); // Verifying mapping from issuer_corporation_id
    expect(contracts[0].type).toBe('courier');
    expect(contracts[0].status).toBe('outstanding');
    expect(contracts[1].contract_id).toBe(4);
    expect(contracts[1].issuer_corporation_id).toBe(2004); // Verifying mapping from issuer_corporation_id
  });

  it('2. should return an empty array if ESI returns no contracts', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    const contracts = await fetchCorporationContracts(mockApiEnv);

    expect(contracts).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('3.1 should throw an error if ESI API returns a 403 Forbidden error', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));

    await expect(fetchCorporationContracts(mockApiEnv)).rejects.toThrow(
      /Failed to fetch ESI contracts: 403 Forbidden. Details: {"error":"Forbidden"}/
    );
  });

  it('3.2 should throw an error if ESI API returns a 500 Internal Server Error', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    await expect(fetchCorporationContracts(mockApiEnv)).rejects.toThrow(
      /Failed to fetch ESI contracts: 500 Internal Server Error. Details: Internal Server Error/
    );
  });

  it('4. should throw an error if fetch encounters a network error', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockRejectedValue(new Error('Network connection failed'));

    await expect(fetchCorporationContracts(mockApiEnv)).rejects.toThrow(
      /An unexpected error occurred while fetching corporation contracts: Error: Network connection failed/
    );
  });

  it('5. should propagate error if getESIAccessToken throws an error', async () => {
    const authError = new Error('Failed to get access token');
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockRejectedValue(authError);

    await expect(fetchCorporationContracts(mockApiEnv)).rejects.toThrow(authError);
    expect(fetchSpy).not.toHaveBeenCalled(); // Fetch should not be called if token retrieval fails
  });

  it('6. should request page 1 of contracts (conceptual pagination check)', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    await fetchCorporationContracts(mockApiEnv);
    
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`page=1`);
  });

  it('7. should throw an error if ESI_CORPORATION_ID is not configured', async () => {
    const envWithoutCorpId = { ...mockApiEnv, ESI_CORPORATION_ID: undefined as any };
    await expect(fetchCorporationContracts(envWithoutCorpId)).rejects.toThrow(
      "ESI_CORPORATION_ID is not configured in the environment."
    );
    expect(getESIAccessToken).not.toHaveBeenCalled(); // Should check before trying to get token
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  
  it('8. should throw an error if ESI response is not an array', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_token');
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: "Not an array" }), { status: 200 }));

    await expect(fetchCorporationContracts(mockApiEnv)).rejects.toThrow(
      "Unexpected ESI response format: Expected an array of contracts."
    );
  });
  
  it('9. should skip contracts with missing critical IDs during mapping', async () => {
    (getESIAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock_access_token_123');
    const mockContractsResponse = [
      mockEsiContract(1), // Valid
      mockEsiContract(2, 'courier', 'outstanding', { contract_id: undefined }), // Missing contract_id
      mockEsiContract(3, 'courier', 'outstanding', { issuer_id: undefined }), // Missing issuer_id
      mockEsiContract(4, 'courier', 'outstanding', { issuer_corporation_id: undefined }), // Missing issuer_corporation_id
      mockEsiContract(5), // Valid
    ];
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockContractsResponse), { status: 200 }));

    const contracts = await fetchCorporationContracts(mockApiEnv);
    
    expect(contracts).toHaveLength(2); // Only contracts 1 and 5 should be valid
    expect(contracts.map(c => c.contract_id)).toEqual([1, 5]);
  });

});
