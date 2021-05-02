import { Registry } from "@lib/cmds/registry";
import { prompt } from "@lib/ux/prompt";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "pussy",
  async run({ msg }) {
    const res = await prompt(msg, "Is pussy good?");
    if (res) {
      return "yesss";
    } else {
      return "aaaaaaaaaaaaaaaaaaaa";
    }
  },
});
