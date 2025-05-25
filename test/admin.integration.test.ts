import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { Miniflare, Log, LogLevel } from 'miniflare';
import fs from 'fs/promises';
import path from 'path';

// Assuming your main Hono app is exported from src/index.ts
// Adjust path as necessary. __dirname is not available in ES modules by default,
// so construct path relative to project root or use import.meta.url.
// For simplicity, assuming test script is run from project root or paths are adjusted.
const projectRoot = path.resolve(__dirname, '..'); // Simple way to get project root if test is in test/
const honoAppPath = path.join(projectRoot, 'src', 'index.ts');
const schemaPath = path.join(projectRoot, 'schema.sql');


// Helper function to create a date string for 'YYYY-MM-DD HH:MM:SS'
// D1 expects dates in this format or ISO8601 for some functions.
// For seeding, using ISOString is safer.
const toIso = (date: Date) => date.toISOString();

// Dates for testing
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);
const lastWeekSameDay = new Date(today);
lastWeekSameDay.setDate(today.getDate() - 7);
const lastMonthSameDay = new Date(today);
lastMonthSameDay.setMonth(today.getMonth() - 1);

const startOfTodayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
const startOfThisMonthUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0));


describe('/admin endpoint integration tests', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    // One-time setup for Miniflare instance
    // Miniflare needs a way to resolve the Hono app.
    // If src/index.ts is simple and doesn't rely on complex build steps for Pages,
    // this direct module approach might work. Otherwise, build step is needed.
    // For robust testing, point to the built _worker.js.
    // This example assumes Hono app can be loaded as an ESModule.
    mf = new Miniflare({
      modules: true,
      scriptPath: honoAppPath, // Path to your main Hono application entry point
      // Ensure environment variables needed by the Hono app are set,
      // especially if they are not in a .dev.vars compatible with Miniflare's testing.
      // For this test, DB is primary. ESI creds are not used by /admin route directly.
      d1Databases: { DB: "testAdminDBIntegration" }, // Use a unique name for this test suite's DB
      d1Persist: false, // In-memory for tests (or true to inspect, then clean up)
      // log: new Log(LogLevel.DEBUG), // Enable for verbose Miniflare logging
    });

    // Apply schema
    try {
      const db = await mf.getD1Database("DB");
      const schema = await fs.readFile(schemaPath, 'utf-8');
      await db.exec(schema);
    } catch (e) {
      console.error("Failed to apply schema in beforeAll:", e);
      throw e;
    }
  });

  afterAll(async () => {
    await mf.dispose();
  });

  beforeEach(async () => {
    // Clear and re-seed data before each test
    const db = await mf.getD1Database("DB");
    try {
      await db.exec("DELETE FROM contracts;");
    } catch (e) {
      console.error("Failed to clear contracts in beforeEach:", e);
      throw e;
    }
  });

  it('should return 200 and display correct statistics based on seeded data', async () => {
    const db = await mf.getD1Database("DB");

    // Seed Data:
    // All contracts share some common values for simplicity unless specified
    const common = {
      issuer_id: 1001, issuer_corporation_id: 2001, 
      start_location_id: 60003760, end_location_id: 60008494,
      type: 'courier', collateral: 1000000, volume: 1000, title: 'Test Contract'
    };

    // 1. Outstanding contract
    await db.prepare("INSERT INTO contracts (contract_id, status, reward, date_issued, ...common fields...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(1, 'outstanding', 100000, toIso(twoDaysAgo), common.issuer_id, common.issuer_corporation_id, common.start_location_id, common.end_location_id, common.type, common.collateral, common.volume, `${common.title} 1`)
      .run();

    // 2. In-progress contract
    await db.prepare("INSERT INTO contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(2, 'in_progress', 200000, common.issuer_id, common.issuer_corporation_id, null, 9001, common.start_location_id, common.end_location_id, common.type, common.collateral, common.volume, toIso(twoDaysAgo), toIso(new Date(Date.now() + 86400000 * 10)), toIso(yesterday), null, 7, `${common.title} 2`)
      .run();
      
    // 3. Finished Today (char 101, 1M reward)
    // date_issued (2 days ago), date_accepted (yesterday), date_completed (today)
    const issued3 = toIso(new Date(startOfTodayUTC.getTime() - 2 * 86400000)); // Issued 2 days before today
    const accepted3 = toIso(new Date(startOfTodayUTC.getTime() - 1 * 86400000)); // Accepted 1 day before today
    const completed3 = toIso(new Date(startOfTodayUTC.getTime() + 1 * 3600000)); // Completed 1 hour into today
    await db.prepare("INSERT INTO contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(3, 'finished_courier', 1000000, common.issuer_id, common.issuer_corporation_id, null, 101, common.start_location_id, common.end_location_id, common.type, common.collateral, common.volume, issued3, toIso(new Date(Date.now() + 86400000 * 10)), accepted3, completed3, 3, `${common.title} 3`)
      .run();

    // 4. Finished This Week (but not today) (char 102, 2M reward)
    // date_issued (4 days ago), date_accepted (3 days ago), date_completed (2 days ago)
    const issued4 = toIso(new Date(startOfTodayUTC.getTime() - 4 * 86400000));
    const accepted4 = toIso(new Date(startOfTodayUTC.getTime() - 3 * 86400000));
    const completed4 = toIso(new Date(startOfTodayUTC.getTime() - 2 * 86400000)); // 2 days ago (within last 7 days)
    await db.prepare("INSERT INTO contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(4, 'finished_courier', 2000000, common.issuer_id, common.issuer_corporation_id, null, 102, common.start_location_id, common.end_location_id, common.type, common.collateral, common.volume, issued4, toIso(new Date(Date.now() + 86400000 * 10)), accepted4, completed4, 5, `${common.title} 4`)
      .run();

    // 5. Finished This Month (but not this week) (char 101, 3M reward)
    // Ensure it's within the month but outside the "this week" window for distinct testing
    // Example: completed 10 days ago, assuming today is not within the first few days of the month
    let completed5Date = new Date(startOfTodayUTC);
    completed5Date.setDate(startOfTodayUTC.getDate() - 10);
    // If completed5Date is now in last month, adjust to be start of this month to ensure it's "this month"
    if (completed5Date.getUTCMonth() !== startOfThisMonthUTC.getUTCMonth()) {
        completed5Date = new Date(startOfThisMonthUTC.getTime() + 3600000); // 1 hour into start of month
    }
    const issued5 = toIso(new Date(completed5Date.getTime() - 3 * 86400000));
    const accepted5 = toIso(new Date(completed5Date.getTime() - 2 * 86400000));
    const completed5 = toIso(completed5Date);
    await db.prepare("INSERT INTO contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(5, 'finished_courier', 3000000, common.issuer_id, common.issuer_corporation_id, null, 101, common.start_location_id, common.end_location_id, common.type, common.collateral, common.volume, issued5, toIso(new Date(Date.now() + 86400000 * 10)), accepted5, completed5, 4, `${common.title} 5`)
      .run();

    // --- Make the request ---
    const res = await mf.dispatchFetch('http://localhost/admin');
    expect(res.status).toBe(200);
    const html = await res.text();

    // --- Assertions ---
    expect(html).toContain('<h1>Courier Contract Statistics</h1>');

    // Overview
    expect(html).toContain('Total Open Contracts: <strong>1</strong>');
    expect(html).toContain('Total In-Progress Contracts: <strong>1</strong>');

    // Finished Contracts
    expect(html).toContain('<h3>Finished Contracts</h3>');
    expect(html).toContain('Today: <strong>1</strong>'); // Contract 3
    expect(html).toContain('This Week: <strong>2</strong>'); // Contracts 3, 4
    expect(html).toContain('This Month: <strong>3</strong>'); // Contracts 3, 4, 5

    // Revenue
    expect(html).toContain('<h3>Revenue (from Finished Contracts)</h3>');
    expect(html).toContain('Today: <strong>1,000,000.00 ISK</strong>'); // Contract 3
    expect(html).toContain('This Week: <strong>3,000,000.00 ISK</strong>'); // 1M (C3) + 2M (C4)
    expect(html).toContain('This Month: <strong>6,000,000.00 ISK</strong>'); // 1M (C3) + 2M (C4) + 3M (C5)

    // Revenue By Character (Sorted by total_revenue DESC)
    // Char 101: 1M (C3) + 3M (C5) = 4M
    // Char 102: 2M (C4)
    expect(html).toMatch(/Character ID<\/th>\s*<th>Total Revenue<\/th>/);
    // Order check: Char 101 (4M) should appear before Char 102 (2M)
    const char101RevenueIndex = html.indexOf('<td>101</td>');
    const char102RevenueIndex = html.indexOf('<td>102</td>');
    const char101RevenueValueIndex = html.indexOf('<td>4,000,000.00 ISK</td>');
    const char102RevenueValueIndex = html.indexOf('<td>2,000,000.00 ISK</td>');
    
    expect(char101RevenueIndex).toBeGreaterThan(-1);
    expect(char102RevenueIndex).toBeGreaterThan(-1);
    expect(char101RevenueValueIndex).toBeGreaterThan(-1);
    expect(char102RevenueValueIndex).toBeGreaterThan(-1);

    expect(char101RevenueIndex).toBeLessThan(char102RevenueIndex); // Check sorting order in HTML

    // Performance Metrics (Durations) - These are harder to assert exactly without more complex date mocking
    // or very precise calculation of avg_seconds and then matching the formatted string.
    // For now, check if the section exists and contains "N/A" or a formatted time string.
    // A more robust test would calculate expected avg_seconds and then expected formatted string.
    expect(html).toContain('<h3>Performance This Month</h3>');
    expect(html).toContain('Avg. Time to Accept:');
    expect(html).toContain('Avg. Completion Time:');
    expect(html).toContain('Avg. Total Time (Issued to Completion):');
    
    // Example for one of them (Contract 3: issued -> accepted = 1 day = 86400s. accepted -> completed = 1 hour = 3600s. total = 1 day 1 hour = 90000s)
    // Only contract 3 is "this month" for acceptance, completion, and total time calculations based on seed data.
    // Contract 4, 5 are also this month for completion and total time.
    // Acceptance time: Contract 3 (accepted today - 1 day), C4 (today - 3 days), C5 (completed5Date - 2 days)
    // This part needs careful calculation based on how AVG works with the seeded data.
    // For contract 3 (accepted yesterday, issued 2 days ago): accept_time = 1 day = 86400s.
    // Expect `formatDuration(86400)` output for avgAcceptanceTimeThisMonth if only C3 considered for accept this month.
    // This is a simplification. Real calculation would average over all contracts accepted this month.
    // For this seed data, only C3, C4, C5 were accepted this month.
    // C3: issued3 -> accepted3 = 1 day = 86400s
    // C4: issued4 -> accepted4 = 1 day = 86400s
    // C5: issued5 -> accepted5 = 1 day = 86400s
    // Avg Acceptance Time = 86400s -> "1d 0h 0m 0s"
    expect(html).toContain('Avg. Time to Accept: <strong>1d 0h 0m 0s</strong>');

    // Completion Time (accepted to completed) for contracts completed this month (C3, C4, C5)
    // C3: accepted3 -> completed3 = 1 day + 1 hour = 90000s
    // C4: accepted4 -> completed4 = 1 day = 86400s
    // C5: accepted5 -> completed5 = 2 days = 172800s
    // Avg Completion Time = (90000 + 86400 + 172800) / 3 = 349200 / 3 = 116400s
    // 116400s = 1d 8h 20m 0s
    expect(html).toContain('Avg. Completion Time: <strong>1d 8h 20m 0s</strong>');

    // Total Time (issued to completed) for contracts completed this month (C3, C4, C5)
    // C3: issued3 -> completed3 = 2 days + 1 hour = 172800 + 3600 = 176400s
    // C4: issued4 -> completed4 = 2 days = 172800s
    // C5: issued5 -> completed5 = 3 days = 259200s
    // Avg Total Time = (176400 + 172800 + 259200) / 3 = 608400 / 3 = 202800s
    // 202800s = 2d 8h 20m 0s
    expect(html).toContain('Avg. Total Time (Issued to Completion): <strong>2d 8h 20m 0s</strong>');

  });

  // Add more test cases if specific edge cases for data aggregation or display need verification.
});
