export type Bindings = {
  DB?: D1Database;
  ASSETS?: Fetcher;
  GUEST_MODE?: string;
  GUEST_ALLOWANCE_VIDEOS?: string;
  APP_ORIGIN?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  NETWORK_HASH_SECRET?: string;
  NETWORK_GUESTS_PER_DAY?: string;
  NETWORK_VIDEOS_PER_DAY?: string;
};

export type ApiEnvironment = { Bindings: Bindings };
