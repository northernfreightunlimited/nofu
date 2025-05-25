import { Hono } from "hono";
import { html } from "hono/html";
import { HTTPException } from "hono/http-exception";
import { RouteFee, getShippingRate } from "./eve/calc_fee";
import {
  IS_JITA_ROUND_TRIP,
  ROUTE_SEP_ARROW,
  ROUTE_SEP_ARROW_RT,
} from "./eve/consts";
import { RouteOptions } from "./eve/routes";
import { System } from "./eve/systems";
import type { D1Database } from "@cloudflare/workers-types";

// Import the admin application
import adminApp from './admin';
// Import the performContractUpdate function and its result type
import { performContractUpdate, PerformContractUpdateResult } from './cron';


const DEFAULT_ROUTE_SELECTION = `${System.UALX}${
  IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW
}${System.Forge}`;

// Define an environment interface that includes bindings needed by any part of the app
interface Env {
  DB: D1Database;
  ESI_CLIENT_ID: string;
  ESI_CLIENT_SECRET: string;
  ESI_REFRESH_TOKEN: string;
  ESI_CORPORATION_ID: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/calc", async (c) => {
  const req = c.req;
  const route = req.query("route");
  const volume = req.query("volume");
  const collateral = req.query("collateral");

  console.log(`
    Route: ${route},
    Volume: ${volume},
    Collateral: ${collateral},
  `);

  // Ensure data validity (add more checks as needed)
  if (!route || !volume || !collateral) {
    throw new HTTPException(400, { message: "Missing required parameters" });
  }

  const shippingRate = getShippingRate(
    route,
    Number(volume),
    Number(collateral),
  );

  console.log(`
    Route: ${shippingRate.route},
    m3: ${volume},
    Reward: ${shippingRate.reward},
    Rate: ${shippingRate.rateStructure.m3Rate}, 
    CRate: ${shippingRate.rateStructure.collateralRate},
  `);

  return c.html(calcResponseTemplate(shippingRate));
});

function copyToClipboardScript() {
  return html`
    <script type="text/hyperscript">
      js
        function clipboardCopy(id, value) {
          navigator.clipboard.writeText(value).then(() => {
            console.log(\`clipboard copy '\${value} (\${id})'\`);
            const tag = document.getElementById(id);
            tag.innerText = "Copied!";
            setTimeout(() => { tag.innerText = " Click to Copy" }, 1000);
          }, () => {
            console.log(\`FAIL clipboard copy '\${value} (\${id})'\`);
          });
        }
      end
      def copyToClipboard(id, value)
        clipboardCopy(id, value)
      end
    </script>
  `;
}

function calcResponseTemplate(r: RouteFee) {
  return html`<dl
    id="calc-output"
    class="calc-output"
    style="visibility: visible;"
  >
    ${copyToClipboardScript()}
    <dt>Route</dt>
    <dd>${r.route}</dd>
    <dt>Contract To</dt>
    <dd
      hx-on:click='copyToClipboard("corp-name", "Northern Freight Unlimited")'
    >
      Northern Freight Unlimited [NOFU]
      <a id="corp-name" class="click-to-copy" title="click-to-copy">
        Click to Copy</a
      >
    </dd>

    <dt>Reward</dt>
    <dd hx-on:click='copyToClipboard("reward", "${r.reward}")'>
      ${r.reward.toLocaleString()}
      <a id="reward" class="click-to-copy" title="click-to-copy">
        Click to Copy</a
      >
    </dd>

    <dt>Contract Rate Structure</dt>
    <dd>
      Rate is ${r.rateStructure.m3Rate.toLocaleString()} isk/m3 +
      ${r.rateStructure.collateralRate * 100}% of collateral
    </dd>

    <dt>Time to Accept/Complete</dt>
    <dd>14 day accept / 7 day complete</dd>

    <dt>Max Volume</dt>
    <dd>${r.maxM3.toLocaleString()}</dd>
  </dl> `;
}

// Returns the route options for customers to choose in the
// calculator dropdown.
app.get("/routes", (c) => {
  const routes = RouteOptions();
  const options = routes.map((option) => {
    const isDefault: boolean = option === DEFAULT_ROUTE_SELECTION;
    return html`<option value="${option}" ${isDefault ? "selected" : ""}>
      ${option}
    </option>`;
  });

  return c.html(options.join("\n"));
});

// Mount the admin application under the /admin path
app.route('/admin', adminApp);

// Endpoint to manually trigger the contract update job
app.post('/api/trigger-contract-update', async (c) => {
    console.log('Manual contract update job triggered via API.');
    try {
        // Ensure 'c.env' is passed, as performContractUpdate expects it.
        const result: PerformContractUpdateResult = await performContractUpdate(c.env); 
        if (result.success) {
            return c.json({ 
                success: true, 
                message: result.message, 
                details: { 
                    fetched: result.contractsFetched, 
                    processed: result.contractsProcessed 
                } 
            }, 200);
        } else {
            console.error('Manual trigger failed:', result.message);
            return c.json({ success: false, message: 'Failed to run contract update job.', error: result.message }, 500);
        }
    } catch (error) {
        console.error('Error in /api/trigger-contract-update endpoint:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return c.json({ success: false, message: 'An unexpected error occurred.', error: errorMessage }, 500);
    }
});

export default app;
