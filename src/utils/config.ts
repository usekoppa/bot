export const config = {
  bot: {
    token: "ODI2MzMzMzMwODg2MjMwMDI3.YGK84g.KcWERaiatQGFPrRYa9qztbSJwpE",
    prefix: "e:",
  },

  db: {
    // This database value refers to the actual database that should be populated.
    database: "epsilon",
    username: "",
    password: "",
  },

  api: {
    host: "localhost",
    port: 3000,
  },
};

// Alias to keep linting consistent.
export type Config = typeof config;
