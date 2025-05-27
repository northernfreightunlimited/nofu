// src/admin/index.ts
// Hono router for the /admin path, fetches statistics from D1, and renders the admin UI.

import { Hono } from 'hono';
import { html } from 'hono/html'; // Not strictly needed here if AdminPageLayout returns HtmlEscapedString
import { AdminPageLayout, AdminStatsData, CharacterRevenue } from './ui'; // Assuming ui.ts is in the same directory
import type { D1Database } from '@cloudflare/workers-types';

// Define the environment interface for Hono Bindings
interface Env {
    DB: D1Database;
    // Other environment variables can be added here if needed by this specific app
}

const adminApp = new Hono<{ Bindings: Env }>();

// Helper type for single count results from D1
interface CountResult {
    count: number;
}

// Helper type for single sum results (total revenue) from D1
interface SumResult {
    total: number | null; // SUM can return null if no rows match
}

// Helper type for single average results (average seconds) from D1
interface AvgSecondsResult {
    avg_seconds: number | null; // AVG can return null if no rows match
}

// Interface for the new character monthly stats query
// This type should match the columns selected by revenueByCharQuery
interface CharacterMonthlyStats {
    acceptor_id: number; 
    total_revenue: number;
    contracts_in_progress_this_month: number;
    contracts_failed_this_month: number;
    contracts_finished_this_month: number;
    character_name?: string; // Now directly selected from the pilots table
}


adminApp.get('/', async (c) => {
    const db = c.env.DB;
    let stats: AdminStatsData;

    // Default values for stats, especially for aggregates that might be null
    const defaultStats: AdminStatsData = {
        totalOpenContracts: 0,
        totalInProgressContracts: 0,
        finishedToday: 0,
        finishedThisWeek: 0,
        finishedThisMonth: 0,
        revenueToday: 0,
        revenueThisWeek: 0,
        revenueThisMonth: 0,
        revenueByCharacterThisMonth: [],
        avgCompletionTimeThisMonth: null,
        avgAcceptanceTimeThisMonth: null,
        avgTotalTimeThisMonth: null,
    };

    try {
        // --- Fetching Statistics ---

        // Total Open Contracts
        const openContractsResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status = 'outstanding'"
        ).first<CountResult>();
        defaultStats.totalOpenContracts = openContractsResult?.count ?? 0;

        // Total In-Progress Contracts
        const inProgressContractsResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status = 'in_progress'"
        ).first<CountResult>();
        defaultStats.totalInProgressContracts = inProgressContractsResult?.count ?? 0;

        // --- Finished Contracts Counts ---
        const finishedTodayResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', 'start of day', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedToday = finishedTodayResult?.count ?? 0;

        // Using '-6 days' for "this week" means the last 7 days including today.
        const finishedThisWeekResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', '-6 days', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedThisWeek = finishedThisWeekResult?.count ?? 0;

        const finishedThisMonthResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedThisMonth = finishedThisMonthResult?.count ?? 0;

        // --- Revenue ---
        const revenueTodayResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', 'start of day', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueToday = revenueTodayResult?.total ?? 0;

        const revenueThisWeekResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', '-6 days', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueThisWeek = revenueThisWeekResult?.total ?? 0;

        const revenueThisMonthResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueThisMonth = revenueThisMonthResult?.total ?? 0;
        
        // Revenue By Character This Month
        // acceptor_id is the character who completed the contract
        const revenueByCharQuery = `
            SELECT 
                c.acceptor_id, 
                p.character_name,
                SUM(CASE WHEN c.status IN ('finished_courier', 'finished') AND c.date_completed >= date('now', 'start of month', 'utc') THEN c.reward ELSE 0 END) as total_revenue,
                SUM(CASE WHEN c.status = 'in_progress' AND c.date_accepted >= date('now', 'start of month', 'utc') THEN 1 ELSE 0 END) as contracts_in_progress_this_month,
                SUM(CASE WHEN c.status = 'failed' AND c.date_completed >= date('now', 'start of month', 'utc') THEN 1 ELSE 0 END) as contracts_failed_this_month,
                SUM(CASE WHEN c.status IN ('finished_courier', 'finished') AND c.date_completed >= date('now', 'start of month', 'utc') THEN 1 ELSE 0 END) as contracts_finished_this_month
            FROM contracts c
            LEFT JOIN pilots p ON c.acceptor_id = p.character_id
            WHERE 
                c.acceptor_id IS NOT NULL 
            GROUP BY c.acceptor_id, p.character_name
            HAVING 
                total_revenue > 0 OR 
                contracts_in_progress_this_month > 0 OR 
                contracts_failed_this_month > 0 OR 
                contracts_finished_this_month > 0
            ORDER BY total_revenue DESC
        `;
        const revenueByCharResult = await db.prepare(revenueByCharQuery).all<CharacterMonthlyStats>();
        
        // Map results to the structure expected by AdminPageLayout (defined in ui.ts)
        // The CharacterMonthlyStats interface in ui.ts expects character_id (not acceptor_id) and character_name
        const mappedResults = revenueByCharResult.results?.map(row => {
            return {
                character_id: row.acceptor_id, // Map acceptor_id from query to character_id for the UI
                total_revenue: row.total_revenue,
                contracts_in_progress_this_month: row.contracts_in_progress_this_month,
                contracts_failed_this_month: row.contracts_failed_this_month,
                contracts_finished_this_month: row.contracts_finished_this_month,
                character_name: row.character_name // Pass through the character_name
            };
        });
        defaultStats.revenueByCharacterThisMonth = mappedResults ?? [];


        // --- Performance Metrics ---
        // Average Time to Accept (Issued to Accepted) in seconds
        const avgAcceptTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_accepted) - julianday(date_issued)) * 86400.0) as avg_seconds FROM contracts WHERE date_accepted IS NOT NULL AND date_issued IS NOT NULL AND date_accepted >= date('now', 'start of month', 'utc')"
        ).first<AvgSecondsResult>();
        defaultStats.avgAcceptanceTimeThisMonth = avgAcceptTimeResult?.avg_seconds ?? null;

        // Average Completion Time (Accepted to Completed) in seconds
        const avgCompleteTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_completed) - julianday(date_accepted)) * 86400.0) as avg_seconds FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed IS NOT NULL AND date_accepted IS NOT NULL AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<AvgSecondsResult>();
        defaultStats.avgCompletionTimeThisMonth = avgCompleteTimeResult?.avg_seconds ?? null;

        // Average Total Time (Issued to Completed) in seconds
        const avgTotalTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_completed) - julianday(date_issued)) * 86400.0) as avg_seconds FROM contracts WHERE status IN ('finished_courier', 'finished') AND date_completed IS NOT NULL AND date_issued IS NOT NULL AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<AvgSecondsResult>();
        defaultStats.avgTotalTimeThisMonth = avgTotalTimeResult?.avg_seconds ?? null;
        
        stats = defaultStats;
        const content = AdminPageLayout(stats);
        return c.html(content);

    } catch (error) {
        console.error("Error fetching admin statistics:", error);
        if (error instanceof Error) {
            console.error(error.message);
            console.error(error.stack);
        }
        return c.text('Failed to load admin statistics. Check server logs.', 500);
    }
});

export default adminApp;
