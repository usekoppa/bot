import { Registry } from "@lib/commands/registry";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "ping",
  run() {
    return "allah";
  },
});
