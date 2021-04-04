// TODO(@zorbyte): Arrange a type-di solution for this.
export const config = {
  bot: {
    token: getCriticalEnvVar("BOT_TOKEN"),
    prefix: "e:",
  },

  db: {
    // This database value refers to the actual database that should be populated.
    name: getCriticalEnvVar("DB_NAME"),
    username: getCriticalEnvVar("DB_USERNAME"),
    password: getCriticalEnvVar("DB_PASSWORD"),
  },

  api: {
    host: process.env.API_HOST ?? "localhost",
    port: process.env.API_PORT ?? 3000,
  },
};

// Alias to keep linting consistent.
export type Config = typeof config;

function getCriticalEnvVar(name: string): string {
  const envVar = process.env[name];
  if (typeof envVar === "undefined") {
    throw new Error(`Critical environment variable ${name} was not found`);
  }

  return envVar;
}
