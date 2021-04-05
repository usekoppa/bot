import { Registry } from "@lib/cmds/registry";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "ping",
  aliases: ["p"],
  run() {
    return "allah";
  },
});
