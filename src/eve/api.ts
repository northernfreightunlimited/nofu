// src/eve/api.ts
// Responsible for fetching corporation contracts from the EVE Online ESI.

import { getESIAccessToken, Env as AuthEnv } from './auth'; // Assuming Env in auth.ts is AuthEnv

// --- Type Definitions ---

/**
 * Interface for the Cloudflare Worker environment variables,
 * extending the base AuthEnv with ESI_CORPORATION_ID.
 */
export interface Env extends AuthEnv {
    ESI_CORPORATION_ID: string;
}

/**
 * Interface for EVE Online contract data, aligning with the D1 schema.
 */
export interface Contract {
    contract_id: number;
    status: string; // e.g., 'outstanding', 'in_progress', 'finished_courier'
    issuer_id: number;
    issuer_corporation_id: number;
    assignee_id?: number; // Character or corporation ID contract is assigned to
    acceptor_id?: number; // Character ID of the character who accepted the contract
    start_location_id: number; // EVE Online location ID (station or structure)
    end_location_id: number; // EVE Online location ID (station or structure)
    type: string; // Should be 'courier' for this application
    reward: number; // ISK
    collateral: number; // ISK
    volume: number; // m3
    date_issued: string; // ISO 8601 format
    date_expired: string; // ISO 8601 format
    date_accepted?: string; // ISO 8601 format, can be null/undefined
    date_completed?: string; // ISO 8601 format, can be null/undefined
    days_to_complete?: number;
    title?: string;
}

// --- ESI Constants ---
const ESI_BASE_URL = "https://esi.evetech.net/latest";
const DATASOURCE = "tranquility";

// --- ESI API Functions ---

/**
 * Fetches outstanding courier contracts for a specified corporation from ESI.
 *
 * @param env - The Cloudflare Worker environment containing ESI credentials and ESI_CORPORATION_ID.
 * @returns A promise that resolves to an array of `Contract` objects.
 * @throws Error if fetching or processing contracts fails.
 */
export async function fetchCorporationContracts(env: Env): Promise<Contract[]> {
    const accessToken = await getESIAccessToken(env);
    const corporationId = env.ESI_CORPORATION_ID;

    if (!corporationId) {
        throw new Error("ESI_CORPORATION_ID is not configured in the environment.");
    }

    // TODO: Implement full pagination support. ESI /contracts endpoint is paginated.
    // Default page size is 1000. For now, fetching page 1.
    // If X-Pages header in response > 1, more pages need to be fetched.
    const page = 1;
    const apiUrl = `${ESI_BASE_URL}/corporations/${corporationId}/contracts/?datasource=${DATASOURCE}&page=${page}`;

    // console.log(`Fetching ESI contracts from: ${apiUrl}`); // For debugging

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
                "Content-Type": "application/json", // Good practice, though less critical for GET
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch ESI contracts: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const esiContracts: any[] = await response.json();

        if (!Array.isArray(esiContracts)) {
            console.error("ESI contracts response is not an array:", esiContracts);
            throw new Error("Unexpected ESI response format: Expected an array of contracts.");
        }

        // Define an array of statuses to fetch
        const TARGET_CONTRACT_STATUSES = [
            "outstanding",
            "in_progress",
            "finished", // Generic "completed"
            "finished_issuer", // Older completed status
            "finished_contractor", // Older completed status
            "cancelled",
            "rejected",
            "failed"
            // Consider if 'deleted' or 'reversed' are needed or returned by this ESI endpoint.
        ];

        // Filter for courier contracts with relevant statuses and map to our Contract interface
        const filteredAndMappedContracts = esiContracts
            .filter(esiContract => 
                esiContract.type === "courier" && 
                TARGET_CONTRACT_STATUSES.includes(esiContract.status)
            )
            .map((esiContract): Contract => {
                // Basic validation for key fields
                if (!esiContract.contract_id || !esiContract.issuer_id || !esiContract.issuer_corporation_id) {
                    console.warn("Skipping contract with missing critical IDs (contract_id, issuer_id, issuer_corporation_id):", esiContract);
                    return null; // Will be filtered out later
                }
                return {
                    contract_id: esiContract.contract_id,
                    status: esiContract.status,
                    issuer_id: esiContract.issuer_id,
                    issuer_corporation_id: esiContract.issuer_corporation_id, // Assuming ESI sends issuer_corporation_id
                    assignee_id: esiContract.assignee_id,
                    acceptor_id: esiContract.acceptor_id,
                    start_location_id: esiContract.start_location_id,
                    end_location_id: esiContract.end_location_id,
                    type: esiContract.type,
                    reward: esiContract.reward,
                    collateral: esiContract.collateral,
                    volume: esiContract.volume,
                    date_issued: esiContract.date_issued,
                    date_expired: esiContract.date_expired,
                    date_accepted: esiContract.date_accepted,
                    date_completed: esiContract.date_completed,
                    days_to_complete: esiContract.days_to_complete,
                    title: esiContract.title,
                };
            })
            .filter(contract => contract !== null) as Contract[]; // Remove nulls from mapping failures

        // console.log(`Fetched and mapped ${filteredAndMappedContracts.length} relevant courier contracts.`); // For debugging
        return filteredAndMappedContracts;

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in fetchCorporationContracts:", error.message);
            throw error; // Re-throw the original error
        }
        throw new Error(`An unexpected error occurred while fetching corporation contracts: ${String(error)}`);
    }
}
