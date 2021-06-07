import { Parameter } from "./parameter";

export interface ParseError {
  name: string;
  reason: string;
}

export function pairError(opts: {
  idx?: number;
  matchingString: string;
  // With the offending string, we should search through the
  // parsers to find what was most likely supplied and then in
  // the error say that the user provided that type as opposed
  // to the expected type. We don't have to do this but it is
  // very nice for the UX. It likely won't have a large
  // performance penalty.
  offendingString: string;
  invalidType?: "list" | "sentence";
  missing?: boolean;
  param: Parameter;
}) {
  opts.idx = opts.idx ?? opts.matchingString.indexOf(opts.offendingString);
  let reason = `... ${opts.matchingString} ...\n`;

  // Add 4 because of the "... ".
  reason += " ".repeat(opts.idx + 4);
  reason += "~".repeat(opts.offendingString.length);
  reason += "\n";
  reason += `Expected ${opts.invalidType === "list" ? "a single " : ""}${
    opts.param.parser.name
  }\n`;

  if (!opts.missing) {
    const inferred =
      opts.invalidType === "list"
        ? "a list of values"
        : opts.invalidType === "sentence"
        ? "a sentence"
        : "something else";

    reason += `but found ${inferred} instead`;
  }

  reason += ".";

  return { name: "something", reason };
}
