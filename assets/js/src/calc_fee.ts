import { MILLIONS } from './consts';
import { routes } from './routes';
import { Destination, RouteFee } from './types';

export function getShippingRate(routeStr: string, desiredM3: number, desiredCollateral: number): RouteFee {
  const route = routes[routeStr] as Destination;
  const maxVolume = route.maxM3;

  // Check for flat rate routes
  if (!isNaN(route.flatRate) && route.flatRate > 0) {
    return {
      route: routeStr,
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

  console.log(
    ` Route: ${route},
    Rate: ${route.m3Rate},
    m3: ${desiredM3},
    Reward: ${calculatedReward},
    RateType: \{ m3Rate: ${route.m3Rate}, collateralRate: ${route.collateralRate} \},
  `);

  return {
    route: routeStr,
    reward: calculatedReward,
    maxM3: route.maxM3,
    rateStructure: { m3Rate: route.m3Rate, collateralRate: route.collateralRate },
  };
}
