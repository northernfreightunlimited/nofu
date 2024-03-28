import { getShippingRate, RouteFee } from "../assets/js/src/calc_fee";

export default {
  async fetch(request: Request) {
    if (request.method == 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Expose-Headers': '*',
        },
      });
    }
    try {
      const formData = await request.formData();
      const route = formData.get("route") as string;
      const volume = formData.get("volume") as string;
      const collateral = formData.get("collateral") as string;

      console.log(formData);

      console.log(`
        Route: ${route},
        Volume: ${volume},
        Collateral: ${collateral},
      `)

      // Ensure data validity (add more checks as needed)
      if (!route || !volume || !collateral) {
        return new Response('Missing required parameters', { status: 400 });
      }

      const shippingRate = getShippingRate(route, Number(volume), Number(collateral));

      console.log(`
        Route: ${shippingRate.route},
        m3: ${volume},
        Reward: ${shippingRate.reward},
        Rate: ${shippingRate.rateStructure.m3Rate}, 
        CRate: ${shippingRate.rateStructure.collateralRate},
      `);

      return new Response(
        calcResponseTemplate(shippingRate),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/html',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }
    catch (error) {
      console.error(error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}

function copyToClipboardScript(): string {
  return `
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

function calcResponseTemplate(r: RouteFee): string {
  return `<dl id="calc-output" class="calc-output" style="visibility: visible;">
    ${copyToClipboardScript()}
    <dt>Route</dt>
    <dd>${r.route}</dd>
    <dt>Contract To</dt>
    <dd hx-on:click="copyToClipboard(&quot;corp-name&quot;, &quot;Northern Freight Unlimited&quot;)">
      Northern Freight Unlimited [NOFU]
      <a id="corp-name" class="click-to-copy" title="click-to-copy"> Click to Copy</a>
    </dd>

    <dt>Reward</dt>
    <dd hx-on:click="copyToClipboard(&quot;reward&quot;, &quot;${r.reward}&quot;)">
      ${r.reward.toLocaleString()}
      <a id="reward" class="click-to-copy" title="click-to-copy"> Click to Copy</a>
    </dd>

    <dt>Contract Rate Structure</dt>
    <dd>Rate is ${r.rateStructure.m3Rate.toLocaleString()} isk/m3 + ${r.rateStructure.collateralRate * 100}% of collateral</dd>

    <dt>Time to Accept/Complete</dt>
    <dd>14 day accept / 7 day complete</dd>

    <dt>Max Volume</dt>
    <dd>${r.maxM3.toLocaleString()}</dd>
    </dl>
  `;
}
