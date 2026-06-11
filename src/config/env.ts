import { config } from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

config({ path: `.env.local.${nodeEnv}` });
config({ path: ".env.local" });
config({ path: ".env" });

const DEFAULT_PORT = 3001;

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

export const env = {
  nodeEnv,
  port: parsePort(process.env.PORT),
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export function hasSupabaseConfig(): boolean {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}
