import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE: required("SUPABASE_SERVICE_ROLE")
};
