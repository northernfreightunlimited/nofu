import { getShippingRate } from "../assets/js/src/calc_fee";

export default {
  async fetch(request: Request) {
    if (request.method == 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    try {
      const { origin, destination, volume, collateral } = await request.json()

      // Ensure data validity (add more checks as needed)
      if (!origin || !destination || !volume || !collateral) {
        return new Response('Missing required parameters', { status: 400 });
      }

      const shippingRate = getShippingRate(origin, destination, volume, collateral);

      console.log(`
        Route: ${shippingRate.route},
        m3: ${volume},
        Reward: ${shippingRate.reward},
        Rate: ${shippingRate.rateStructure.m3Rate}, 
        CRate: ${shippingRate.rateStructure.collateralRate},
      `);

      return new Response(
        JSON.stringify(shippingRate),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
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

