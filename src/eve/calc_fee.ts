import { MILLIONS } from "./consts";
import { RouteCalc, routes } from "./routes";

export interface RouteFee {
  route: string;
  reward: number;
  maxM3: number;
  rateStructure: {
    m3Rate: number;
    collateralRate: number;
  };
}

const routeMap = new Map<string, RouteCalc>();
for (const route of routes) {
  for (const destination of route.destinations) {
    const r = new RouteCalc(route.origin, destination);
    routeMap[r.toString()] = r;
  }
}

export function getShippingRate(
  routeStr: string,
  desiredM3: number,
  desiredCollateral: number,
): RouteFee {
  const route = routeMap[routeStr];
  const maxVolume = route.maxM3;

  // Check for flat rate routes
  if (!isNaN(route.flatRate) && route.flatRate > 0) {
    return {
      route: route.toString(),
      reward: route.flatRate,
      maxM3: route.maxM3,
      rateStructure: { m3Rate: 0, collateralRate: 0 }, // Special case for flat rate. Consider making this more explicit.
    };
  }

  if (desiredM3 > maxVolume) {
    throw new Error(
      "Desired Volume (${desiredM3}) larger than maximum allowed (${maxVolume})",
    );
  }

  const desiredCollateralInMillions = desiredCollateral * MILLIONS;

  const m3Fee = desiredM3 * route.m3Rate;
  const collateralFee = desiredCollateralInMillions * route.collateralRate;
  const calculatedReward = Math.max(m3Fee + collateralFee, route.minReward);

  return {
    route: route.toString(),
    reward: calculatedReward,
    maxM3: route.maxM3,
    rateStructure: {
      m3Rate: route.m3Rate,
      collateralRate: route.collateralRate,
    },
  };
}
