import { format } from "util";

import { parameter } from "@parser/parameter";
import { stringParser } from "@parser/parsers/string";

import { FunPlugin } from "..";

FunPlugin.command({
  name: "8ball",
  description: "Ask the magic 8ball a question",
  usage: [parameter("question", stringParser)],
  run(ctx) {
    return `bitch = ${format(ctx.args)}`;
  },
});
