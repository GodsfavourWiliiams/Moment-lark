export type Bindings = {
  DB?: D1Database;
  ASSETS?: Fetcher;
  GUEST_MODE?: string;
  GUEST_ALLOWANCE_VIDEOS?: string;
  APP_ORIGIN?: string;
};

export type ApiEnvironment = { Bindings: Bindings };
