export interface Destination {
  destination: string;
  minReward?: number;
  maxCollateral?: number;
  maxM3?: number;
  m3Rate: number; // isk per m3
  collateralRate?: number; // percent fee of collateral to charge
  isRoundTrip?: boolean;
  flatRate?: number; // flat rate fee
}

export interface Route {
  origin: string;
  destinations: Destination[];
}

export interface CalcFeeResponse {
  route: string;
  reward: number;
  maxM3: number;
  rateStructure: {
    m3Rate: number;
    collateralRate: number;
  };
}

export interface CalcFeeRequest {
  origin: string;
  destination: string;
  volume: number;
  collateral?: number;
}
