export const DEFAULT_COLLATERAL_PERCENTAGE_FEE = 0.0075; // 0.75%
export const JITA_REDUCED_MIN_REWARD = 10e6; // 10m
export const MILLIONS = 1e6; // 1m

// Rates
export const FOUR_JUMP_RT = 700;
export const STANDARD_IMPORT_FROM_JITA_RATE = 850;
export const STANDARD_EXPORT_TO_JITA_RATE = 850;
export const JITA_RATE_DISCOUNT = 0;
export const IS_JITA_ROUND_TRIP = false;
export const STANDARD_DOMAIN_RATE = FOUR_JUMP_RT;
export const FOUNTAIN_DELVE_RATE = 900;

// Defaults where not otherwise specified
export const ROUTE_DEFAULTS = {
  minReward: 30e6, // 30m
  maxCollateral: 100e9, // 100b
  collateralRate: DEFAULT_COLLATERAL_PERCENTAGE_FEE, // percent collateral to charge as reward
  maxM3: 350000, // 350k m3
  isRoundTrip: false,
  flatRate: NaN,
};

export const ROUTE_SEP_ARROW = " ➠ ";
export const ROUTE_SEP_ARROW_RT = " ⮂ ";
