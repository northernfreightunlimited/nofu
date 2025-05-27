-- SQL schema for EVE Online Contracts
-- Compatible with SQLite (Cloudflare D1)

-- Table to store EVE Online courier contracts
CREATE TABLE IF NOT EXISTS contracts (
    -- Unique EVE Online contract ID
    contract_id INTEGER PRIMARY KEY,
    -- Current status of the contract (e.g., outstanding, in_progress, finished_courier)
    status TEXT NOT NULL,
    -- EVE Character or Corporation ID of the issuer
    issuer_id INTEGER NOT NULL,
    -- EVE Corporation ID of the issuer
    issuer_corporation_id INTEGER NOT NULL,
    -- EVE Corporation ID to whom the contract is assigned (should be the character's corporation for courier contracts)
    assignee_id INTEGER, -- This might be the corporation ID the contract is available to.
    -- EVE Character ID of the character who accepted the contract
    acceptor_id INTEGER,
    -- EVE Online location ID (station or structure) for pickup
    start_location_id INTEGER NOT NULL,
    -- EVE Online location ID (station or structure) for dropoff
    end_location_id INTEGER NOT NULL,
    -- Type of contract, should be 'courier'
    type TEXT NOT NULL, -- Should always be 'courier' for this application
    -- Reward amount in ISK
    reward REAL NOT NULL,
    -- Collateral amount in ISK
    collateral REAL NOT NULL,
    -- Volume in m3
    volume REAL NOT NULL,
    -- Date when the contract was issued (ISO 8601 format)
    date_issued TEXT NOT NULL,
    -- Date when the contract will expire if not accepted (ISO 8601 format)
    date_expired TEXT NOT NULL,
    -- Date when the contract was accepted (ISO 8601 format)
    date_accepted TEXT,
    -- Date when the contract was completed (ISO 8601 format)
    date_completed TEXT,
    -- Number of days allowed to complete the contract
    days_to_complete INTEGER,
    -- Optional title of the contract
    title TEXT
);

-- Table to store character information (ID to Name mapping)
CREATE TABLE IF NOT EXISTS pilots (
    -- EVE Online Character ID
    character_id INTEGER PRIMARY KEY,
    -- EVE Online Character Name
    character_name TEXT NOT NULL
);
