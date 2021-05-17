import { Registry } from "@cmds/registry";
import { prompt } from "@ux/prompt";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "prompt",
  async run(opts) {
    const res = await prompt(opts, "something?");
    if (res) {
      return "you said yes";
    } else {
      return "I guess it's a no";
    }
  },
});
