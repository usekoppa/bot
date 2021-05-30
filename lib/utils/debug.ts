export const level = parseInt(process.env.DEBUG ?? "0", 10);
export const debug = level >= 1;
