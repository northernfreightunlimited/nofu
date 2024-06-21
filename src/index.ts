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

const DEFAULT_ROUTE_SELECTION = `1DQ1-A${
  IS_JITA_ROUND_TRIP ? ROUTE_SEP_ARROW_RT : ROUTE_SEP_ARROW
}Jita/Perimeter`;

const app = new Hono();

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

export default app;
