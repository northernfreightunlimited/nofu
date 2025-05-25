// src/cron.ts
// Handles the scheduled cron job for fetching and storing EVE Online contracts.
// Also provides a reusable function for on-demand contract updates.

import { fetchCorporationContracts, Contract } from './eve/api'; // Path assuming cron.ts is in src/ and api.ts is in src/eve/
import type { D1Database, D1Result, D1PreparedStatement, ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

/**
 * Interface for Cloudflare Worker environment variables.
 * These secrets and bindings must be configured in your Worker settings.
 */
export interface Env {
    ESI_CLIENT_ID: string;
    ESI_CLIENT_SECRET: string;
    ESI_REFRESH_TOKEN: string;
    ESI_CORPORATION_ID: string;
    DB: D1Database; // D1 Database binding
}

/**
 * Interface for the result of the contract update operation.
 */
export interface PerformContractUpdateResult {
    success: boolean;
    message: string;
    contractsFetched?: number;
    contractsProcessed?: number; // Number of rows affected (inserted/updated)
}

/**
 * Fetches outstanding courier contracts from ESI and upserts them into the D1 database.
 * This function can be called by the cron job or potentially by an HTTP endpoint.
 *
 * @param env - The Cloudflare Worker environment containing secrets and bindings.
 * @returns A promise that resolves to a PerformContractUpdateResult object.
 */
export async function performContractUpdate(env: Env): Promise<PerformContractUpdateResult> {
    try {
        console.log("performContractUpdate: Fetching corporation contracts from ESI...");
        const contracts: Contract[] = await fetchCorporationContracts(env);

        if (contracts.length === 0) {
            const msg = "No new outstanding courier contracts found.";
            console.log(`performContractUpdate: ${msg}`);
            return { success: true, message: msg, contractsFetched: 0 };
        }

        console.log(`performContractUpdate: Fetched ${contracts.length} outstanding courier contract(s).`);

        const db = env.DB;
        if (!db) {
            // This check is more for robustness; in a Worker, env.DB should be configured or it's a deployment issue.
            throw new Error("D1 Database (env.DB) is not available.");
        }

        const upsertSql = `
            INSERT INTO contracts (
                contract_id, status, issuer_id, issuer_corporation_id, assignee_id, 
                acceptor_id, start_location_id, end_location_id, type, reward, 
                collateral, volume, date_issued, date_expired, date_accepted, 
                date_completed, days_to_complete, title
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?
            ) ON CONFLICT(contract_id) DO UPDATE SET
                status = excluded.status,
                issuer_id = excluded.issuer_id,
                issuer_corporation_id = excluded.issuer_corporation_id,
                assignee_id = excluded.assignee_id,
                acceptor_id = excluded.acceptor_id,
                start_location_id = excluded.start_location_id,
                end_location_id = excluded.end_location_id,
                type = excluded.type,
                reward = excluded.reward,
                collateral = excluded.collateral,
                volume = excluded.volume,
                date_issued = excluded.date_issued,
                date_expired = excluded.date_expired,
                date_accepted = excluded.date_accepted,
                date_completed = excluded.date_completed,
                days_to_complete = excluded.days_to_complete,
                title = excluded.title;
        `;

        const statements: D1PreparedStatement[] = contracts.map(contract => {
            return db.prepare(upsertSql).bind(
                contract.contract_id,
                contract.status,
                contract.issuer_id,
                contract.issuer_corporation_id,
                contract.assignee_id ?? null,
                contract.acceptor_id ?? null,
                contract.start_location_id,
                contract.end_location_id,
                contract.type,
                contract.reward,
                contract.collateral,
                contract.volume,
                contract.date_issued,
                contract.date_expired,
                contract.date_accepted ?? null,
                contract.date_completed ?? null,
                contract.days_to_complete ?? null,
                contract.title ?? null
            );
        });

        console.log(`performContractUpdate: Preparing to batch upsert ${statements.length} contract(s) into D1...`);
        const batchResults: D1Result[] = await db.batch(statements);
        
        // Calculate total rows affected (inserted/updated)
        // D1Result.meta.changes or D1Result.meta.rows_written can be used.
        // 'changes' is standard SQLite for rows inserted, updated, or deleted.
        // 'rows_written' is specific to D1 and might be more direct for inserts/updates.
        let totalRowsAffected = 0;
        batchResults.forEach(result => {
            if (result.meta && typeof result.meta.changes === 'number') {
                totalRowsAffected += result.meta.changes;
            } else if (result.meta && typeof result.meta.rows_written === 'number') { // Fallback for D1 specific
                totalRowsAffected += result.meta.rows_written;
            }
        });

        const successMsg = `D1 batch operation completed. Fetched: ${contracts.length}, Processed (upserted/updated): ${totalRowsAffected}.`;
        console.log(`performContractUpdate: ${successMsg}`);
        return { 
            success: true, 
            message: successMsg, 
            contractsFetched: contracts.length, 
            contractsProcessed: totalRowsAffected 
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("performContractUpdate: Error during contract update:", errorMsg);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
        return { success: false, message: `Error updating contracts: ${errorMsg}` };
    }
}

export default {
    /**
     * Handles the scheduled event (cron trigger).
     * Calls performContractUpdate and logs the result.
     *
     * @param event - The scheduled event information.
     * @param env - The Cloudflare Worker environment containing secrets and bindings.
     * @param ctx - The execution context of the Worker.
     */
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log(`Cron job started at: ${new Date(event.scheduledTime).toISOString()} (Trigger: ${event.cron})`);

        const result = await performContractUpdate(env);

        if (result.success) {
            console.log(`Cron job finished successfully: ${result.message}`);
            if (typeof result.contractsFetched === 'number') {
                 console.log(`Contracts Fetched: ${result.contractsFetched}`);
            }
            if (typeof result.contractsProcessed === 'number') {
                 console.log(`Contracts Processed (Upserted/Updated in D1): ${result.contractsProcessed}`);
            }
        } else {
            console.error(`Cron job failed: ${result.message}`);
        }
        console.log("Cron job finished processing.");
    }
};
