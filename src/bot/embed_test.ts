import { createGenericResponse } from "@lib/cmds/cmd_util";
import { Registry } from "@lib/cmds/registry";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "ping",
  aliases: ["p"],
  run({ msg }) {
    const pingTime = Math.abs(Date.now() - msg.createdTimestamp);

    return createGenericResponse(msg.author)
      .setTitle(":ping_pong: Pong!")
      .setDescription(`It took **${pingTime}ms** to send this message.`);
  },
});
