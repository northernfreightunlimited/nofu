#!/usr/bin/env node

// Dependencies:
// This script uses built-in Node.js modules (http, url, crypto, readline)
// and external libraries (open, node-fetch).
// Install external libraries using: npm install open node-fetch
// Or: yarn add open node-fetch

import http from 'http';
import { URL, URLSearchParams } from 'url';
import crypto from 'crypto';
import readline from 'readline';
import open from 'open';
import fetch from 'node-fetch';
import fs from 'fs/promises'; // Added for writing .dev.vars

// --- Configuration ---
const EVE_LOGIN_URL = "https://login.eveonline.com/v2/oauth/authorize/";
const EVE_TOKEN_URL = "https://login.eveonline.com/v2/oauth/token";
const REQUIRED_SCOPES = [
    "esi-contracts.read_corporation_contracts.v1",
    "publicData" // Often useful for basic character verification if needed later
].join(' '); // ESI expects scopes as a space-separated string

const LOCAL_PORT = 8085; // Port for the local server
const CALLBACK_PATH = "/oauth/callback";
const REDIRECT_URI = `http://localhost:${LOCAL_PORT}${CALLBACK_PATH}`;

/**
 * Prompts the user for input via the console.
 * @param {string} question - The question to ask the user.
 * @returns {Promise<string>} A promise that resolves with the user's input.
 */
function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Decodes a JWT payload (simple base64 decode, no signature verification).
 * @param {string} token - The JWT string.
 * @returns {object | null} The decoded payload or null if decoding fails.
 */
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn("Token is not a valid JWT format (missing parts).");
            return null;
        }
        const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
        return JSON.parse(payload);
    } catch (error) {
        console.error("Error decoding JWT payload:", error.message);
        return null;
    }
}

/**
 * Main function to orchestrate the OAuth flow.
 */
async function main() {
    console.log("--- EVE Online ESI Token Generator ---");
    console.log("You will be asked for your ESI Application's Client ID and Secret Key.");
    console.log(`Ensure your ESI Application has the Redirect URI set to: ${REDIRECT_URI}`);
    console.log(`And the required scopes: ${REQUIRED_SCOPES}\n`);

    const esiClientId = await promptUser("Enter your ESI Application Client ID: ");
    if (!esiClientId) {
        console.error("Client ID is required. Exiting.");
        return;
    }

    const esiClientSecret = await promptUser("Enter your ESI Application Secret Key: ");
    if (!esiClientSecret) {
        console.error("Client Secret is required. Exiting.");
        return;
    }

    // Generate a random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Construct the authorization URL
    const authUrlParams = new URLSearchParams({
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        client_id: esiClientId,
        scope: REQUIRED_SCOPES,
        state: state,
    });
    const authorizationUrl = `${EVE_LOGIN_URL}?${authUrlParams.toString()}`;

    console.log("\nStarting local server for OAuth callback...");

    // Declare server variable here so it's accessible in SIGINT handler if server.listen fails
    let server; 

    server = http.createServer(async (req, res) => {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);

        if (requestUrl.pathname === CALLBACK_PATH) {
            console.log("\nCallback received. Processing...");
            const queryParams = requestUrl.searchParams;
            const receivedCode = queryParams.get('code');
            const receivedState = queryParams.get('state');

            if (receivedState !== state) {
                console.error("Error: State mismatch. Possible CSRF attack.");
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("State mismatch. Please try again.");
                server.close(() => process.exit(1));
                return;
            }

            if (!receivedCode) {
                console.error("Error: No authorization code received.");
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("No authorization code received. Please try again.");
                server.close(() => process.exit(1));
                return;
            }

            // Exchange authorization code for tokens
            try {
                console.log("Exchanging authorization code for tokens...");
                const tokenRequestBody = new URLSearchParams({
                    grant_type: "authorization_code",
                    code: receivedCode,
                    // redirect_uri: REDIRECT_URI, // Not strictly required by ESI in POST body, but good practice
                });

                const authHeader = `Basic ${Buffer.from(`${esiClientId}:${esiClientSecret}`).toString('base64')}`;

                const tokenResponse = await fetch(EVE_TOKEN_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": authHeader,
                        "Host": "login.eveonline.com",
                    },
                    body: tokenRequestBody.toString(),
                });

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
                }

                const tokenData = await tokenResponse.json();
                const { access_token, refresh_token, expires_in } = tokenData;

                console.log("\n--- Tokens Received ---");
                // console.log("Access Token:", access_token); // Usually not needed by user directly
                console.log("Refresh Token:", refresh_token);
                console.log("Expires In (seconds):", expires_in);

                // Decode JWT to get Character ID and scopes
                const decodedAccessToken = decodeJWT(access_token);
                let characterId = "UNKNOWN (Could not decode JWT or 'sub' claim missing)";
                let jwtScopes = "UNKNOWN (Could not decode JWT or 'scp'/'scopes' claim missing)";

                if (decodedAccessToken) {
                    if (decodedAccessToken.sub && decodedAccessToken.sub.startsWith("CHARACTER:EVE:")) {
                        characterId = decodedAccessToken.sub.split(':')[2];
                    } else {
                        console.warn("JWT 'sub' claim missing or not in expected format:", decodedAccessToken.sub);
                    }

                    if (decodedAccessToken.scp && Array.isArray(decodedAccessToken.scp)) {
                        jwtScopes = decodedAccessToken.scp.join(' ');
                    } else if (decodedAccessToken.scopes && Array.isArray(decodedAccessToken.scopes)) { // Some JWTs use 'scopes'
                         jwtScopes = decodedAccessToken.scopes.join(' ');
                    } else if (typeof decodedAccessToken.scp === 'string') {
                        jwtScopes = decodedAccessToken.scp;
                    } else if (typeof decodedAccessToken.scopes === 'string') {
                        jwtScopes = decodedAccessToken.scopes;
                    }
                    else {
                        console.warn("JWT 'scp' or 'scopes' claim missing or not an array/string:", decodedAccessToken.scp || decodedAccessToken.scopes);
                    }
                }

                console.log("Character ID (from JWT 'sub'):", characterId);
                console.log("Scopes (from JWT 'scp'/'scopes'):", jwtScopes);
                console.log("------------------------\n");

                console.log("🎉 Success! You have obtained your ESI Refresh Token and Character ID.");

                // Prompt for ESI_CORPORATION_ID
                const esiCorporationId = await promptUser("\nEnter your ESI Corporation ID (the ID of the corp you want to fetch contracts for): ");
                if (!esiCorporationId) {
                    console.error("\nESI Corporation ID is required. Cannot write .dev.vars completely.");
                    // Optionally, decide if you want to proceed without it or exit.
                    // For now, we'll proceed and .dev.vars will have an empty ESI_CORPORATION_ID
                }
                
                const devVarsContent = `ESI_CLIENT_ID="${esiClientId}"
ESI_CLIENT_SECRET="${esiClientSecret}"
ESI_REFRESH_TOKEN="${refresh_token}"
ESI_AUTHORIZED_CHARACTER_ID="${characterId}"
ESI_CORPORATION_ID="${esiCorporationId || ''}"
`;
                try {
                    await fs.writeFile('.dev.vars', devVarsContent);
                    console.log('\n✅ Successfully wrote ESI credentials to .dev.vars file.');
                } catch (err) {
                    console.error('\n❌ Error writing .dev.vars file:', err.message);
                }

                // Still log credentials to console for visibility and manual setup if needed
                console.log("\n--- Your ESI Credentials (also written to .dev.vars if successful) ---");
                console.log(`ESI_CLIENT_ID:               "${esiClientId}"`);
                console.log(`ESI_CLIENT_SECRET:           "${esiClientSecret}"`);
                console.log(`ESI_REFRESH_TOKEN:           "${refresh_token}"`);
                console.log(`ESI_AUTHORIZED_CHARACTER_ID: "${characterId}"`);
                console.log(`ESI_CORPORATION_ID:          "${esiCorporationId || ''}"`);
                console.log("----------------------------------------------------------------------\n");
                console.log("Ensure these values are also set as secrets in your Cloudflare Worker production environment.");
                console.log("The .dev.vars file is used for local development with 'wrangler pages dev'.\n");


                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end("<h1>Authentication Successful!</h1><p>You can close this window. Check your console for credentials and .dev.vars status.</p>");
                
                console.log("Server shutting down after successful operation...");
                server.close((err) => {
                  if (err) console.error('Error closing server after success:', err);
                  else console.log('Server closed successfully.');
                  console.log('Exiting script.');
                  process.exit(0); // Force exit after server has confirmed close
                });

            } catch (error) {
                console.error("\nError during token exchange or processing:", error.message);
                if (error.response) console.error("Response body:", await error.response.text());
                
                // Ensure response is sent before trying to close server and exit
                if (!res.writableEnded) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("An error occurred. Check the console for details.");
                }
                
                console.log("Server shutting down after error...");
                server.close((closeErr) => {
                  if (closeErr) console.error('Error closing server after error:', closeErr);
                  else console.log('Server closed after error.');
                  process.exit(1);
                });
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("Not Found. Waiting for OAuth callback...");
        }
    });

    server.listen(LOCAL_PORT, (err) => {
        if (err) {
            console.error("Failed to start server:", err);
            process.exit(1);
        }
        console.log(`Local server listening on port ${LOCAL_PORT}.`);
        console.log("A browser window will now be opened for EVE Online authentication.");
        console.log("If it doesn't open, please manually visit:");
        console.log(authorizationUrl);
        open(authorizationUrl);
    });

    // Keep script running until server is closed by callback or error
    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down from SIGINT (Ctrl+C)...');
      const shutdownTimeout = setTimeout(() => {
        console.log('Graceful shutdown timed out. Forcing exit.');
        process.exit(1); // Force exit if not closed within ~2 seconds
      }, 2000);
      shutdownTimeout.unref(); // Allow Node.js to exit if this is the only timer

      if (server && server.listening) { // Check if server exists and is listening
        server.close((err) => {
          clearTimeout(shutdownTimeout);
          if (err) console.error('Error closing server during SIGINT:', err);
          else console.log('Server closed during SIGINT.');
          process.exit(0);
        });
      } else {
        clearTimeout(shutdownTimeout);
        console.log('Server was not running or already closed. Exiting.');
        process.exit(0); // If server wasn't running or already closed
      }
    });
}

main().catch(error => {
    console.error("\nUnhandled error in main function:", error);
    process.exit(1);
});
