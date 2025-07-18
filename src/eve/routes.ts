import {
  // FOUR_JUMP_RT,
  IS_JITA_ROUND_TRIP,
  // JITA_RATE_DISCOUNT,
  JITA_REDUCED_MIN_REWARD,
  ROUTE_DEFAULTS,
  ROUTE_SEP_ARROW,
  ROUTE_SEP_ARROW_RT,
  // STANDARD_DOMAIN_RATE,
  // STANDARD_EXPORT_TO_JITA_RATE,
  // STANDARD_IMPORT_FROM_JITA_RATE,
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
    origin: System.CJ,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: 1200,
        isRoundTrip: false,
        minReward: JITA_REDUCED_MIN_REWARD,
      },
      {
        destination: System.Domain,
        m3Rate: 900,
        isRoundTrip: false,
      },
      {
        destination: System.UALX,
        m3Rate: 550,
        collateralRate: 0,
        isRoundTrip: true,
      },
    ],
  },
  {
    origin: System.UALX,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: 900,
        isRoundTrip: false,
      },
      {
        destination: System.Domain,
        m3Rate: 775,
        isRoundTrip: false,
      },
    ],
  },
  {
    origin: System.GEZ,
    destinations: [
      {
        destination: System.Forge,
        m3Rate: 825,
        isRoundTrip: false,
      },
    ],
  },
  {
    origin: System.Forge,
    destinations: [
      {
        destination: System.UALX,
        m3Rate: 900,
        minReward: JITA_REDUCED_MIN_REWARD,
        collateralRate: 0,
        isRoundTrip: IS_JITA_ROUND_TRIP,
      },
      {
        destination: System.GEZ,
        m3Rate: 800,
        minReward: JITA_REDUCED_MIN_REWARD,
        collateralRate: 0,
        isRoundTrip: IS_JITA_ROUND_TRIP,
      },
      {
        destination: System.CJ,
        m3Rate: 1200,
        collateralRate: 0,
        minReward: JITA_REDUCED_MIN_REWARD,
        isRoundTrip: false,
      },
    ],
  },
  {
    origin: System.Domain,
    destinations: [
      {
        destination: System.UALX,
        m3Rate: 775,
        isRoundTrip: false,
        collateralRate: 0,
      },
      {
        destination: System.CJ,
        m3Rate: 900,
        isRoundTrip: false,
        collateralRate: 0,
      },
    ],
  },
];
