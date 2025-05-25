// src/cron.ts
// Handles the scheduled cron job for fetching and storing EVE Online contracts.

import { fetchCorporationContracts, Contract } from './eve/api'; // Path assuming cron.ts is in src/ and api.ts is in src/eve/
import type { D1Database, ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

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

export default {
    /**
     * Handles the scheduled event (cron trigger).
     * Fetches outstanding courier contracts from ESI and upserts them into the D1 database.
     *
     * @param event - The scheduled event information.
     * @param env - The Cloudflare Worker environment containing secrets and bindings.
     * @param ctx - The execution context of the Worker.
     */
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log(`Cron job started at: ${new Date(event.scheduledTime).toISOString()} (Trigger: ${event.cron})`);

        try {
            // 1. Fetch outstanding courier contracts from ESI
            console.log("Fetching corporation contracts from ESI...");
            const contracts: Contract[] = await fetchCorporationContracts(env);

            if (contracts.length === 0) {
                console.log("No new outstanding courier contracts found.");
                console.log("Cron job finished.");
                return;
            }

            console.log(`Fetched ${contracts.length} outstanding courier contract(s).`);

            // 2. Prepare and execute batch upsert into D1 Database
            const db = env.DB;
            if (!db) {
                throw new Error("D1 Database (env.DB) is not available.");
            }

            // SQL statement for "upsert":
            // If a contract with the same contract_id exists, update its fields.
            // Otherwise, insert a new row.
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

            const statements = contracts.map(contract => {
                return db.prepare(upsertSql).bind(
                    contract.contract_id,
                    contract.status,
                    contract.issuer_id,
                    contract.issuer_corporation_id,
                    contract.assignee_id ?? null, // Handle optional fields
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

            console.log(`Preparing to batch upsert ${statements.length} contract(s) into D1...`);
            const batchResults = await db.batch(statements);
            
            // Log batch results (D1 batch currently returns an array of D1Result objects)
            // Each result might have { success: boolean, meta: { duration: number, rows_read: number, rows_written: number, last_row_id: any } }
            // For simplicity, we'll just log the number of statements.
            // You can iterate through batchResults for more detailed logging if needed.
            let successCount = 0;
            let failureCount = 0;
            batchResults.forEach(result => {
                // D1Result success is true if the individual statement succeeded
                // This might be too verbose, but useful for initial debugging.
                // if (result.success) { // D1Result does not have a `success` property directly on the outer object
                //    successCount++;
                // } else {
                //    failureCount++;
                // }
                // A more robust check might involve checking result.meta.changes or similar if available
                // For now, we assume if db.batch doesn't throw, the operations were accepted by D1.
            });

            // D1 `batch` will throw an error if the batch operation itself fails.
            // If it completes, it means D1 accepted the batch.
            // The results array gives info per statement, but not a simple overall success/failure count.
            console.log(`D1 batch operation completed. Processed ${contracts.length} contracts.`);
            // console.log(`Detailed results (if available): ${JSON.stringify(batchResults, null, 2)}`);


        } catch (error) {
            if (error instanceof Error) {
                console.error("Cron job failed:", error.message);
                console.error("Stack trace:", error.stack);
            } else {
                console.error("Cron job failed with an unknown error:", error);
            }
        } finally {
            console.log("Cron job finished.");
        }
    }
};
