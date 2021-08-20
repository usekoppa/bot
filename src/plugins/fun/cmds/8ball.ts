import { parameter } from "../lib/parser/parameter";
import { stringTransformer } from "../lib/parser/transformers/string";
import { numDigits } from "@utils/num_digits";
import { xmur3 } from "@utils/xmur3";

import { FunPlugin } from "..";

const resps = [
  "this is a response",
  "here's another bitch",
  "a resp",
  "aaaaaa",
  "sheeesh",
  "asdlfkj",
];
const noOfRespLenDigits = numDigits(resps.length);

FunPlugin.command({
  name: "8ball",
  aliases: ["8"],
  description: "Ask the magic 8ball a question",
  usage: [
    parameter("question", stringTransformer, {
      sentence: true,
      aliases: ["q"],
    }),
  ],
  run(ctx) {
    const seed = xmur3(ctx.args.question);
    const lastXDigits = seed % 10 ** noOfRespLenDigits;
    const respIdx = lastXDigits % resps.length;
    return resps[respIdx];
  },
});
