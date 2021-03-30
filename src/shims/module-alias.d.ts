declare module "module-alias" {
  export function addAlias(alias: string, realPath: string): void;
  export function addAliases(aliases: Record<string, string>): void;
}
