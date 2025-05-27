// src/admin/ui.ts
// Contains functions to generate HTML for the admin statistics page.

import { html } from 'hono/html';

// --- Data Interfaces ---

/**
 * Represents revenue data for a single character.
 */
export interface CharacterMonthlyStats { // Renaming to CharacterMonthlyStats can be done here if preferred, but following subtask to update CharacterRevenue
    character_id: number; // Note: This was acceptor_id in the D1 query result
    total_revenue: number;
    contracts_in_progress_this_month: number;
    contracts_failed_this_month: number;
    contracts_finished_this_month: number;
    character_name?: string; // Optional: for future ESI name resolution
}

/**
 * Defines the structure for the statistics data passed to the UI functions.
 * Durations (avgCompletionTimeThisMonth, avgAcceptanceTimeThisMonth, avgTotalTimeThisMonth)
 * are expected in seconds.
 */
export interface AdminStatsData {
    totalOpenContracts: number;
    totalInProgressContracts: number;
    finishedToday: number;
    finishedThisWeek: number;
    finishedThisMonth: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    revenueByCharacterThisMonth: CharacterMonthlyStats[];
    avgCompletionTimeThisMonth: number | null; // Average time from 'accepted' to 'completed' in seconds
    avgAcceptanceTimeThisMonth: number | null; // Average time from 'issued' to 'accepted' in seconds
    avgTotalTimeThisMonth: number | null; // Average time from 'issued' to 'completed' in seconds
}

// --- Helper Functions ---

/**
 * Formats a number as ISK currency with commas and two decimal places.
 * @param amount - The numeric amount to format.
 * @returns A string representing the formatted ISK value (e.g., "1,234,567.00 ISK").
 */
const formatISK = (amount: number): string => {
    if (isNaN(amount)) return '0.00 ISK';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ISK';
};

/**
 * Formats a duration given in total seconds into a human-readable string (e.g., "X d Y h Z m S s").
 * Only shows relevant parts (e.g., hides days if 0).
 * @param totalSeconds - The duration in total seconds. Can be null.
 * @returns A string representing the formatted duration or "N/A".
 */
const formatDuration = (totalSeconds: number | null): string => {
    if (totalSeconds === null || typeof totalSeconds === 'undefined' || isNaN(totalSeconds) || totalSeconds < 0) {
        return 'N/A';
    }

    if (totalSeconds === 0) {
        return '0s';
    }

    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    let remainder = totalSeconds % (24 * 60 * 60);

    const hours = Math.floor(remainder / (60 * 60));
    remainder %= (60 * 60);

    const minutes = Math.floor(remainder / 60);
    const seconds = Math.floor(remainder % 60);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) { // Always show seconds if it's the only unit or non-zero
        parts.push(`${seconds}s`);
    }
    
    return parts.join(' ') || '0s'; // Fallback to '0s' if somehow parts is empty (e.g. totalSeconds very small fractional)
};

// --- Main Page Layout ---

/**
 * Generates the complete HTML page for the admin statistics.
 * @param stats - An object containing all the calculated statistics.
 * @returns An HTML string representing the admin statistics page.
 */
export const AdminPageLayout = (stats: AdminStatsData) => html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EVE Courier Contracts - Admin Stats</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            margin: 0; 
            background-color: #1a1a1a; /* Dark background */
            color: #e0e0e0; /* Light text */
            line-height: 1.6;
        }
        .container { 
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px; 
            background-color: #2c2c2c; /* Darker card background */
            border-radius: 8px; 
            box-shadow: 0 0 15px rgba(0,0,0,0.5); 
        }
        h1, h2 { 
            color: #00aaff; /* Accent color for headers */
            border-bottom: 2px solid #00aaff;
            padding-bottom: 0.3em;
        }
        h1 { text-align: center; margin-bottom: 30px; }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .stat-card { 
            background-color: #3b3b3b; /* Slightly lighter card item background */
            padding: 20px; 
            border-radius: 6px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .stat-card h3 { 
            margin-top: 0; 
            color: #00caff; /* Lighter accent for card headers */
            font-size: 1.2em;
            border-bottom: 1px solid #4f4f4f;
            padding-bottom: 0.5em;
            margin-bottom: 1em;
        }
        .stat-card p { margin: 0.5em 0; }
        .stat-card strong { color: #ffffff; /* White for emphasis */ }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        th, td { 
            text-align: left; 
            padding: 12px; 
            border-bottom: 1px solid #4f4f4f; /* Darker border */
        }
        th { 
            background-color: #00aaff; /* Header background with accent color */
            color: #1a1a1a; /* Dark text on accent background */
            font-weight: bold;
        }
        td { background-color: #3b3b3b; }
        tbody tr:hover td { background-color: #4f4f4f; /* Hover effect for table rows */ }
        .no-data {
            text-align: center;
            padding: 20px;
            background-color: #3b3b3b;
            border-radius: 4px;
            margin-top: 20px;
        }
        #triggerUpdateBtn {
            background-color: #00aaff;
            color: #1a1a1a;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.3s;
        }
        #triggerUpdateBtn:hover {
            background-color: #0077cc;
        }
        #triggerUpdateBtn:disabled {
            background-color: #555;
            cursor: not-allowed;
        }
        #triggerUpdateStatus {
            margin-top: 10px;
            min-height: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Courier Contract Statistics</h1>

        <div class="stat-card" style="margin-bottom: 20px;"> <!-- Actions Card -->
            <h3>Actions</h3>
            <button id="triggerUpdateBtn" type="button">Manually Run Contract Update</button>
            <div id="triggerUpdateStatus"></div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Overview</h3>
                <p>Total Open Contracts: <strong>${stats.totalOpenContracts}</strong></p>
                <p>Total In-Progress Contracts: <strong>${stats.totalInProgressContracts}</strong></p>
            </div>

            <div class="stat-card">
                <h3>Finished Contracts</h3>
                <p>Today: <strong>${stats.finishedToday}</strong></p>
                <p>This Week: <strong>${stats.finishedThisWeek}</strong></p>
                <p>This Month: <strong>${stats.finishedThisMonth}</strong></p>
            </div>
            
            <div class="stat-card">
                <h3>Revenue (from Finished Contracts)</h3>
                <p>Today: <strong>${formatISK(stats.revenueToday)}</strong></p>
                <p>This Week: <strong>${formatISK(stats.revenueThisWeek)}</strong></p>
                <p>This Month: <strong>${formatISK(stats.revenueThisMonth)}</strong></p>
            </div>

            <div class="stat-card">
                <h3>Performance This Month</h3>
                <p>Avg. Time to Accept: <strong>${formatDuration(stats.avgAcceptanceTimeThisMonth)}</strong></p>
                <p>Avg. Completion Time: <strong>${formatDuration(stats.avgCompletionTimeThisMonth)}</strong></p>
                <p>Avg. Total Time (Issued to Completion): <strong>${formatDuration(stats.avgTotalTimeThisMonth)}</strong></p>
            </div>
        </div>

        <h2>Revenue And Activity This Month By Character</h2>
        ${stats.revenueByCharacterThisMonth && stats.revenueByCharacterThisMonth.length > 0 ? html`
        <table>
            <thead>
                <tr>
                    <th>Character ID</th>
                    <th>Total Revenue (This Month)</th>
                    <th>Finished (This Month)</th>
                    <th>In Progress (Accepted This Month)</th>
                    <th>Failed (This Month)</th>
                </tr>
            </thead>
            <tbody>
                ${stats.revenueByCharacterThisMonth.map(charStat => html`
                <tr>
                    <td>${charStat.character_id} ${charStat.character_name ? '(' + charStat.character_name + ')' : ''}</td>
                    <td>${formatISK(charStat.total_revenue)}</td>
                    <td>${charStat.contracts_finished_this_month}</td>
                    <td>${charStat.contracts_in_progress_this_month}</td>
                    <td>${charStat.contracts_failed_this_month}</td>
                </tr>
                `)}
            </tbody>
        </table>` : html`<p class="no-data">No activity data by character for this month.</p>`}
    </div>

    ${html`
    <script>
        const triggerBtn = document.getElementById('triggerUpdateBtn');
        const statusDiv = document.getElementById('triggerUpdateStatus');

        if (triggerBtn && statusDiv) {
            triggerBtn.addEventListener('click', async () => {
                statusDiv.textContent = 'Triggering update job...';
                statusDiv.style.color = '#e0e0e0'; // Default text color
                triggerBtn.disabled = true;

                try {
                    // Using an absolute path for the fetch request
                    const response = await fetch('/api/trigger-contract-update', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        statusDiv.textContent = data.message || 'Job status unknown.';
                        statusDiv.style.color = data.success ? 'lightgreen' : 'salmon'; // Using lightgreen and salmon for dark theme
                    } else {
                        statusDiv.textContent = 'Failed to trigger job. Server responded with status: ' + response.status;
                        statusDiv.style.color = 'salmon';
                    }
                } catch (error) {
                    statusDiv.textContent = 'Network error or script failed: ' + (error instanceof Error ? error.message : String(error));
                    statusDiv.style.color = 'salmon';
                } finally {
                    triggerBtn.disabled = false;
                }
            });
        }
    </script>
    `}
</body>
</html>
`;

// Note: Individual statistic rendering functions (renderOverviewStats, etc.)
// have been incorporated directly into the AdminPageLayout template for conciseness,
// following the provided example structure. If these sections grow significantly,
// they could be refactored into separate functions returning html`` tagged template literals.
