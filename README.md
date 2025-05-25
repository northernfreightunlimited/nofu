# Northern Freight Unlimited Site and Calculator

This repo contains the source code for <https://northernfreightunlimited.com>.

## Project Overview

This project is an EVE Online courier contract monitoring application. It automatically fetches outstanding courier contracts for a specified EVE Online corporation using the ESI API. The fetched contracts are stored in a Cloudflare D1 database. A cron job ensures regular updates of this data. An admin web interface, accessible at `/admin`, provides key statistics about the contracts, such as open and in-progress counts, revenue figures, and average contract lifecycle times. The system is designed to be deployed on Cloudflare Pages and utilizes Cloudflare Workers for backend logic.

## Features

*   **Automated Contract Fetching**: Regularly fetches corporation courier contracts via the EVE Online ESI API.
*   **D1 Database Storage**: Stores contract data efficiently in Cloudflare D1.
*   **Scheduled Updates**: A cron job (configurable in `wrangler.toml`) ensures contract data is periodically updated.
*   **Admin Statistics UI**: A web interface at `/admin` displays key metrics, including:
    *   Counts of open and in-progress contracts.
    *   Number of contracts finished today, this week, and this month.
    *   Revenue generated today, this week, and this month.
    *   Revenue breakdown by character for the current month.
    *   Average time for contract acceptance, completion, and total lifecycle (issued to completion).
*   **Secure Credential Handling**: Uses a local script (`scripts/generate_esi_tokens.mjs`) to generate a long-lived ESI refresh token, which is then stored as a secret in Cloudflare, minimizing exposure of sensitive credentials.
*   **Local Development Environment**: Comprehensive local setup using Vite, Wrangler, and Miniflare for emulation of Cloudflare Pages, D1, and cron triggers.
*   **Unit and Integration Testing**: Includes tests for key components using `vitest`.

## Common Commands

```bash
# Install dependencies
npm install

# Run dev server using vite (for frontend development, may not include all CF features)
npm run dev # or
npx vite

# Run "prod-like" local environment with local D1 persistence & cron emulation
npm run preview

# Build the project for deployment
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Apply database schema to local D1 instance
npm run db:migrate:local

# Apply database schema to remote/production D1 instance
npx wrangler d1 execute DB --file=./schema.sql --remote
# Note: Ensure your wrangler.toml is configured for the correct production D1 binding ("DB").
```

## Local Development

This section provides instructions for setting up and running the application in a local development environment. This setup uses Cloudflare Wrangler and Miniflare to emulate the Cloudflare Pages environment, including D1 database persistence and cron trigger emulation.

### Prerequisites

*   **Node.js and npm**: Ensure you have Node.js (which includes npm) installed. You can download it from [nodejs.org](https://nodejs.org/).
*   **Cloudflare Wrangler CLI**: Wrangler is used to develop and deploy Cloudflare Workers and Pages. It's listed as a dev dependency and will be available via `npx wrangler` or `npm run` scripts. If you wish to install it globally, you can run `npm install -g wrangler`.

### Initial Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This will install all necessary packages defined in `package.json`, including Hono, Vite, Wrangler, and other development tools.

### ESI Application Setup & Credential Generation

To interact with the EVE Online ESI (EVE Swagger Interface) for fetching contracts, you need to register an ESI application for your character or corporation. This step is required for both local development and production.

1.  **Create an ESI Application**:
    *   Go to the [EVE Online Developers site](https://developers.eveonline.com/applications) and log in.
    *   Create a new application.
    *   Set the "Connection Type" to "Authentication & API Access".
    *   **Required Scopes**: Add the following scopes to your application:
        *   `esi-contracts.read_corporation_contracts.v1`
        *   `publicData` (often useful for character verification, though not directly used by the token script for ID, it's good practice for general ESI interaction)
    *   **Callback URL**: For the token generation script, set your Callback URL (Redirect URI) to `http://localhost:8085/oauth/callback`. This is used by the local script to capture the authorization code. After token generation, you can remove or change this callback URL if desired, as it's only needed for the script's operation.

2.  **Generate ESI Refresh Token and Character ID**:
    *   Once your ESI application is set up and you have your Client ID and Secret Key, run the provided script:
        ```bash
        node scripts/generate_esi_tokens.mjs
        ```
    *   The script will prompt you to enter your ESI Application Client ID and Secret Key.
    *   It will then open a browser window, asking you to log into EVE Online and authorize the application for the scopes you configured.
    *   After successful authorization, the script will output the following to your console:
        *   `ESI_REFRESH_TOKEN`: A long-lived token used to obtain new access tokens.
        *   `ESI_AUTHORIZED_CHARACTER_ID`: The EVE Character ID of the character who authorized the application.
    *   Keep these values safe. They will be used as secrets in Cloudflare for production, and in `.dev.vars` for local development.

### Configure Local Environment Variables (`.dev.vars`)

Cloudflare Wrangler uses a `.dev.vars` file (in the project root) to load environment variables for local development. This file should not be committed to version control.

1.  **Create `.dev.vars` file**: In the root of your project, create a file named `.dev.vars`.
2.  **Add Environment Variables**: Populate it with the credentials obtained in the ESI setup and your corporation ID.
    ```ini
    ESI_CLIENT_ID="YOUR_ESI_CLIENT_ID"
    ESI_CLIENT_SECRET="YOUR_ESI_CLIENT_SECRET"
    ESI_REFRESH_TOKEN="YOUR_GENERATED_REFRESH_TOKEN"
    ESI_AUTHORIZED_CHARACTER_ID="YOUR_GENERATED_CHARACTER_ID" 
    ESI_CORPORATION_ID="YOUR_CORPORATION_ID" 
    ```
    *   Replace placeholders with your actual ESI Client ID, Secret Key, the Refresh Token, and Character ID generated by the script.
    *   **`ESI_CORPORATION_ID`**: You must manually find and enter the EVE Online Corporation ID for which you want to fetch contracts. You can find this ID in-game (e.g., from corporation details) or by using ESI lookup tools with your character ID. The cron job will use this ID to fetch corporation contracts.

### Local Database Setup

The application uses a D1 database to store contract data. For local development, this database is persisted in the `.mf/d1` directory within your project.

1.  **Apply Database Schema**:
    *   Run the following command to create the necessary tables in your local D1 database:
        ```bash
        npm run db:migrate:local
        ```
    *   This command executes the SQL statements in `schema.sql` against your local D1 database instance (`DB`), ensuring the `contracts` table is set up correctly. The `--persist-to=.mf/d1` flag ensures it operates on the same persisted data store used by `npm run preview`.

### Running the Application Locally

To run the application locally with full emulation of the Cloudflare environment (including Pages Functions, D1, cron triggers, and `.dev.vars`):

1.  **Start the Development Server**:
    ```bash
    npm run preview
    ```
2.  **Functionality**:
    *   This command first runs `npm run build` (which uses Vite to build the frontend assets and Pages Functions).
    *   Then, it starts `wrangler pages dev` with the `--persist-to=.mf/d1` flag.
    *   The application is typically served on `http://localhost:8787` (Wrangler will indicate the actual port if different).
    *   **Live Reloading**: Changes to your Pages Functions (in `src/`) should trigger automatic rebuilding and reloading. Frontend changes might require a manual refresh or Vite's HMR if fully configured.
    *   **Local D1 Database**: Your D1 database (`DB`) will be emulated locally and data will be persisted in the `.mf/d1` directory.
    *   **Cron Trigger Emulation**: Wrangler will emulate the cron triggers defined in `wrangler.toml`. You will see log output in the Wrangler console when a cron job (`*/15 * * * *` for contract fetching) is triggered and runs.
    *   **Environment Variables**: Secrets and variables defined in your `.dev.vars` file will be loaded into the local environment.

### Accessing the Application Locally

*   **Main Application (Calculator, etc.)**: Access it at the root URL provided by Wrangler (e.g., `http://localhost:8787`).
*   **Admin Interface**: The admin statistics page will be available at `/admin` (e.g., `http://localhost:8787/admin`).

This setup allows for a comprehensive local development experience that closely mirrors the production Cloudflare Pages environment.

## Cloudflare Configuration (Production)

To deploy and run this application in a production Cloudflare environment, you need to configure a D1 database and set up secrets.

### D1 Database (Production)

1.  **Create D1 Database**:
    *   Go to your Cloudflare Dashboard.
    *   Navigate to "Workers & Pages" -> "D1".
    *   Click "Create database". Give it a name (e.g., `eve_contracts_db_prod`) and choose a region.
2.  **Find Database ID**:
    *   Once created, select your database in the D1 dashboard.
    *   The "Database ID" will be displayed. You'll need this for `wrangler.toml`.
3.  **Update `wrangler.toml`**:
    *   Open `wrangler.toml` in your project.
    *   Locate the `[[d1_databases]]` section for your production environment (or add one if you manage multiple environments). Ensure the `binding` is "DB".
    *   Uncomment or set the `database_id` field with the ID you obtained from the Cloudflare dashboard.
        ```toml
        [[d1_databases]]
        binding = "DB" # This is how your Worker code refers to the database
        database_name = "eve_contracts_db_prod" # Descriptive name in Cloudflare
        database_id = "YOUR_ACTUAL_D1_DATABASE_ID_HERE" # Replace with your ID
        # For production, you might have specific preview_database_id or different sections.
        # This example assumes one primary production D1.
        ```
4.  **Apply Database Schema (Production)**:
    *   Run the following command to apply the schema from `schema.sql` to your production D1 database. Ensure your Wrangler CLI is logged in and configured for the correct Cloudflare account.
        ```bash
        npx wrangler d1 execute DB --file=./schema.sql --remote
        ```
    *   The `DB` here refers to the `binding` name in your `wrangler.toml`. `--remote` targets your configured production D1 database.

### Secrets (Production)

Configure these secrets in your Cloudflare Pages project settings (Settings -> Functions -> Environment variables -> Production).

*   **`ESI_CLIENT_ID`**: Your ESI application's Client ID.
*   **`ESI_CLIENT_SECRET`**: Your ESI application's Secret Key.
*   **`ESI_REFRESH_TOKEN`**: The refresh token obtained by running the `scripts/generate_esi_tokens.mjs` script (see "ESI Application Setup & Credential Generation" section above).
*   **`ESI_AUTHORIZED_CHARACTER_ID`**: The character ID associated with the refresh token, also obtained from the script. While not directly used by all parts of the current application, it's good practice to store it if your ESI interactions might expand.
*   **`ESI_CORPORATION_ID`**: The EVE Online Corporation ID for which contracts should be fetched. You need to find this ID manually (e.g., in-game or via ESI lookup tools).

## Deployment

1.  **Build and Deploy**:
    *   Ensure all your changes are committed to Git.
    *   Run the deployment script:
        ```bash
        npm run deploy
        ```
    *   This command executes `npm run build` (which builds the frontend and functions) and then `wrangler pages deploy dist` (deploys the contents of the `dist/` directory to Cloudflare Pages).
2.  **Post-Deployment**:
    *   After successful deployment, Cloudflare Pages will provide you with a unique URL (e.g., `your-project.pages.dev`).
    *   The cron job defined in `wrangler.toml` will automatically start running based on its schedule.
    *   Verify your D1 database connection and that secrets are correctly configured if you encounter issues.

## Admin Interface

*   **Access**: The admin statistics page is available at `/admin` on your deployed site's URL (e.g., `https://your-project.pages.dev/admin`).
*   **Functionality**: Displays various statistics related to courier contracts, such as counts of open/in-progress/finished contracts, revenue figures, and average contract lifecycle times.

## Cron Job

*   **Function**: A cron job is configured to automatically fetch new and updated corporation courier contracts from the ESI.
*   **Schedule**: It runs every 15 minutes (`*/15 * * * *`), as defined in the `[[crons]]` section of `wrangler.toml`.
*   **Operation**: When triggered, it executes the `scheduled` handler in `src/cron.ts`, which fetches contracts via `src/eve/api.ts` and upserts them into the D1 database.

## Architecture

The app is designed to run on [CloudFlare
Pages](https://developers.cloudflare.com/pages/), using simple [Function
routing](https://developers.cloudflare.com/pages/functions/routing/).
There are two pages, `index.html` and `404.html`. The index page contains a
single interactive element, the calculator.

The calc relies on two routes defined in the functions to operate: `/routes` and
`/calc`. The former returns all the available routes between two star systems, and
latter calculates the fee for a route given the collateral and volume parameters.
[HTMX](https://htmx.org/) is used for client-side scripting.

The `[[routes]].ts` file captures all Pages Function calls (defined in
`_routes.json`).  However, all the requests are then routed through the
[Hono app](https://hono.dev/docs/) in `src/index.ts`.

## How To

### Update routes

Make changes to `src/eve/routes.ts`.

### Add a new Function route

Update the Hono app configuration and then make sure to update `_routes.json`.

### Assets in public are 404'ing

You may need to update the exclusion list for the vite dev server plugin.

## Potential ToDos

1. Use SSR to generate the list of routes for the drop down at build time instead
of requiring a browser request to fetch it.
1. Migrate HTML responses to their own template files instead of inlining.
