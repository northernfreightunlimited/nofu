import {
  FOUNTAIN_DELVE_RATE,
  FOUR_JUMP_RT,
  IS_JITA_ROUND_TRIP,
  JITA_RATE_DISCOUNT,
  JITA_REDUCED_MIN_REWARD,
  ROUTE_DEFAULTS,
  ROUTE_SEP_ARROW,
  ROUTE_SEP_ARROW_RT,
  STANDARD_DOMAIN_RATE,
  STANDARD_EXPORT_TO_JITA_RATE,
  STANDARD_IMPORT_FROM_JITA_RATE,
} from "./consts.js";
import { System } from "./systems.js";
import { Destination, Route } from "./types.js";

export class RouteCalc implements Destination {
  readonly origin: string;
  readonly destination: string;
  readonly m3Rate: number; // isk per m3
  readonly collateralRate: number; // percent fee of collateral to charge
  readonly minReward: number;
  readonly maxCollateral: number;
  readonly maxM3: number;
  readonly isRoundTrip: boolean;
  readonly flatRate: number;

  constructor(origin: string, destination: Destination) {
    this.origin = origin;
    this.destination = destination.destination;
    this.m3Rate = destination.m3Rate;
    this.collateralRate =
      destination.collateralRate ?? ROUTE_DEFAULTS.collateralRate;
    this.minReward = destination.minReward ?? ROUTE_DEFAULTS.minReward;
    this.maxM3 = destination.maxM3 ?? ROUTE_DEFAULTS.maxM3;
    this.maxCollateral =
      destination.maxCollateral ?? ROUTE_DEFAULTS.maxCollateral;
    this.isRoundTrip = destination.isRoundTrip ?? ROUTE_DEFAULTS.isRoundTrip;
    this.flatRate = destination.flatRate ?? ROUTE_DEFAULTS.flatRate;
  }

  toString(): string {
    if (this.isRoundTrip) {
      return this.origin + ROUTE_SEP_ARROW_RT + this.destination;
    }
    return this.origin + ROUTE_SEP_ARROW + this.destination;
  }
}

// RouteOptions returns a sorted list of RouteCalc.toString()
// for each route in routes.
export function RouteOptions(): string[] {
  const routeOptions: string[] = [];
  for (const route of routes) {
    for (const destinations of route.destinations) {
      const r = new RouteCalc(route.origin, destinations);
      const routeStr = r.toString();
      routeOptions.push(routeStr);
    }
  }
  routeOptions.sort();
  return routeOptions;
}

export const routes: Route[] = [
  {
    origin: System.ImperialPalace,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE - JITA_RATE_DISCOUNT,
        minReward: JITA_REDUCED_MIN_REWARD, // 10m
        isRoundTrip: IS_JITA_ROUND_TRIP,
      },
      {
        destination: System.DP,
        m3Rate: 750,
        isRoundTrip: true,
      },
      {
        destination: System.O4T,
        m3Rate: 750,
        isRoundTrip: true,
      },
      {
        destination: System.CloudRing,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + FOUR_JUMP_RT / 2,
        isRoundTrip: true,
      },
      {
        destination: System.Ahbazon,
        m3Rate: FOUR_JUMP_RT,
        isRoundTrip: true,
      },
      {
        destination: System.Domain,
        m3Rate: STANDARD_DOMAIN_RATE,
        isRoundTrip: true,
      },
      {
        destination: System.Initiative,
        m3Rate: FOUNTAIN_DELVE_RATE,
      },
      {
        destination: System.PeriodBasis,
        m3Rate: FOUR_JUMP_RT,
        isRoundTrip: true,
      },
      {
        destination: System.Zinkon,
        m3Rate: STANDARD_DOMAIN_RATE,
        isRoundTrip: true,
      },
      {
        destination: System.Delve,
        m3Rate: 300,
        isRoundTrip: true,
      },
      {
        destination: System.Serren,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
        isRoundTrip: true,
      },
      {
        destination: System.Querious,
        m3Rate: 300,
        isRoundTrip: true,
      },
      {
        destination: System.Amok,
        m3Rate: 250,
        isRoundTrip: true,
      },
      {
        destination: System.Alterari,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE + FOUR_JUMP_RT,
        isRoundTrip: false,
        collateralRate: 0,
      },
    ],
  },
  {
    origin: System.Initiative,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
      },
      {
        destination: System.ImperialPalace,
        m3Rate: FOUNTAIN_DELVE_RATE,
      },
    ],
  },
  {
    origin: System.Forge,
    destinations: [
      {
        destination: System.CloudRing,
        m3Rate: STANDARD_DOMAIN_RATE,
        isRoundTrip: true,
      },
      {
        destination: System.ImperialPalace,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE - JITA_RATE_DISCOUNT,
        minReward: JITA_REDUCED_MIN_REWARD,
        collateralRate: 0,
        isRoundTrip: IS_JITA_ROUND_TRIP,
      },
      {
        destination: System.Initiative,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE,
      },
      {
        destination: System.Querious,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 100,
        isRoundTrip: true,
      },
      {
        destination: System.Serren,
        m3Rate: FOUR_JUMP_RT,
        isRoundTrip: true,
      },
      {
        destination: System.Amok,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 50,
        isRoundTrip: true,
      },
      {
        destination: System.PeriodBasis,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 350,
        isRoundTrip: true,
      },
      {
        destination: System.O4T,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 750,
      },
      {
        destination: System.DP,
        m3Rate: STANDARD_IMPORT_FROM_JITA_RATE + 750,
        isRoundTrip: true,
      },
      {
        destination: System.Alterari,
        m3Rate: FOUR_JUMP_RT,
        isRoundTrip: false,
        collateralRate: 0,
      },
    ],
  },
  {
    origin: System.Irmalin,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
      },
      {
        destination: System.ImperialPalace,
        m3Rate: 500,
      },
    ],
  },
  {
    origin: System.Zinkon,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: STANDARD_EXPORT_TO_JITA_RATE,
      },
    ],
  },
];
