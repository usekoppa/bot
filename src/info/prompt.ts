import { Registry } from "@lib/cmds/registry";
import { prompt } from "@lib/ux/prompt";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "prompt",
  async run({ msg }) {
    const res = await prompt(msg, "here is a question");
    if (res) {
      return "you said yes";
    } else {
      return "I guess it's a no";
    }
  },
});
