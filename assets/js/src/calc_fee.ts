import { MILLIONS } from './consts';
import { RouteCalc, routes } from './routes';

export interface RouteFee {
  route: string,
  reward: number,
  maxM3: number,
  rateStructure: {
    m3Rate: number,
    collateralRate: number,
  },
};

function getRoute(origin: string, destination: string): RouteCalc {
  for (const route of routes) {
    if (route.origin != origin) {
      continue;
    }

    for (const dest of route.destinations) {
      if (dest.destination != destination) {
        continue;
      }

      return new RouteCalc(route.origin, dest);
    }
  }
  throw new Error(`Unknown route: ${origin} to ${destination}`);
}

export function getShippingRate(origin: string, destination: string, desiredM3: number, desiredCollateral: number): RouteFee {
  const route = getRoute(origin, destination);
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
    throw new Error("Desired Volume (${desiredM3}) larger than maximum allowed (${maxVolume})");
  }

  const desiredCollateralInMillions = desiredCollateral * MILLIONS;

  const m3Fee = desiredM3 * route.m3Rate;
  const collateralFee = desiredCollateralInMillions * route.collateralRate;
  const calculatedReward = Math.max(m3Fee + collateralFee, route.minReward);

  return {
    route: route.toString(),
    reward: calculatedReward,
    maxM3: route.maxM3,
    rateStructure: { m3Rate: route.m3Rate, collateralRate: route.collateralRate },
  };
}
