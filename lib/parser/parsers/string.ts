import { Parser } from "../parser";

export const stringParser: Parser<string> = {
  name: "string",
  parse(_, arg) {
    return arg;
  },
};
