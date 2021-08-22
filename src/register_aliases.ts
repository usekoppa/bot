import { join } from "path";

import { addAliases } from "module-alias";

// Since the aliases haven't been registered like this, we have to use the relative path.
import { readJsonSync } from "../lib/utils/read_json";

interface AliasesOfTsConfig {
  compilerOptions: {
    paths: Record<string, string[]>;
  };
}

const tsConfig = readJsonSync<AliasesOfTsConfig>(
  join(process.cwd(), "tsconfig.json")
);

// Registers aliases for the @ prefixed imports.
// They are configured in the tsconfig.json file.
addAliases(
  Object.fromEntries(
    Object.entries(tsConfig.compilerOptions.paths).map(([key, value]) => [
      key.endsWith("/*") ? key.slice(0, -2) : key,

      // Removes "./" and prepends "../" to the path value.
      join(
        __dirname,
        `../${value[0].slice(2, key.endsWith("/*") ? -2 : void 0)}`
      ),
    ])
  )
);
