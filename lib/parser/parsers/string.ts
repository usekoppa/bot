import { Parser } from "../parser";

export const stringParser: Parser<string> = {
  name: "string",
  parse({ arg }) {
    return arg;
  },
};
