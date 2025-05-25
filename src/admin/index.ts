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
            "SELECT COUNT(*) as count FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', 'start of day', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedToday = finishedTodayResult?.count ?? 0;

        // Using '-6 days' for "this week" means the last 7 days including today.
        const finishedThisWeekResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', '-6 days', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedThisWeek = finishedThisWeekResult?.count ?? 0;

        const finishedThisMonthResult = await db.prepare(
            "SELECT COUNT(*) as count FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<CountResult>();
        defaultStats.finishedThisMonth = finishedThisMonthResult?.count ?? 0;

        // --- Revenue ---
        const revenueTodayResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', 'start of day', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueToday = revenueTodayResult?.total ?? 0;

        const revenueThisWeekResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', '-6 days', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueThisWeek = revenueThisWeekResult?.total ?? 0;

        const revenueThisMonthResult = await db.prepare(
            "SELECT SUM(reward) as total FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<SumResult>();
        defaultStats.revenueThisMonth = revenueThisMonthResult?.total ?? 0;
        
        // Revenue By Character This Month
        // acceptor_id is the character who completed the contract
        const revenueByCharResult = await db.prepare(
            "SELECT acceptor_id, SUM(reward) as total_revenue FROM contracts WHERE status = 'finished_courier' AND date_completed >= date('now', 'start of month', 'utc') AND acceptor_id IS NOT NULL GROUP BY acceptor_id ORDER BY total_revenue DESC"
        ).all<CharacterRevenue>();
        defaultStats.revenueByCharacterThisMonth = revenueByCharResult.results ?? [];


        // --- Performance Metrics ---
        // Average Time to Accept (Issued to Accepted) in seconds
        const avgAcceptTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_accepted) - julianday(date_issued)) * 86400.0) as avg_seconds FROM contracts WHERE date_accepted IS NOT NULL AND date_issued IS NOT NULL AND date_accepted >= date('now', 'start of month', 'utc')"
        ).first<AvgSecondsResult>();
        defaultStats.avgAcceptanceTimeThisMonth = avgAcceptTimeResult?.avg_seconds ?? null;

        // Average Completion Time (Accepted to Completed) in seconds
        const avgCompleteTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_completed) - julianday(date_accepted)) * 86400.0) as avg_seconds FROM contracts WHERE status = 'finished_courier' AND date_completed IS NOT NULL AND date_accepted IS NOT NULL AND date_completed >= date('now', 'start of month', 'utc')"
        ).first<AvgSecondsResult>();
        defaultStats.avgCompletionTimeThisMonth = avgCompleteTimeResult?.avg_seconds ?? null;

        // Average Total Time (Issued to Completed) in seconds
        const avgTotalTimeResult = await db.prepare(
            "SELECT AVG((julianday(date_completed) - julianday(date_issued)) * 86400.0) as avg_seconds FROM contracts WHERE status = 'finished_courier' AND date_completed IS NOT NULL AND date_issued IS NOT NULL AND date_completed >= date('now', 'start of month', 'utc')"
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
