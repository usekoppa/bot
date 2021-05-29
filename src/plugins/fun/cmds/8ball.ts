import { format } from "util";

import { parameter } from "@cmds/syntax/parameter";
import { stringParser } from "@cmds/syntax/parsers/string";

import { FunPlugin } from "..";

FunPlugin.command({
  name: "8ball",
  description: "Ask the magic 8ball a question",
  usage: [parameter("question", stringParser)],
  run(ctx) {
    return `bitch = ${format(ctx.args)}`;
  },
});
