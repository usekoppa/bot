import { Registry } from "@lib/cmds/registry";
import { createGenericResponse, EmbedColours } from "@lib/msg_ux/embeds";

import { Container } from "typedi";

const registry = Container.get(Registry);

registry.add({
  name: "wip",
  async run({ msg }) {
    const m = await msg.channel.send(
      createGenericResponse(
        msg.author,
        "If you agree, you will not see this again"
      )
        .setTitle("Just a heads-up...")
        .setColor(EmbedColours.Warning)
        .setDescription(
          "This feature is a Work-In-Progress and as such could have bugs." +
            "\n\n**Do you wish to proceed?**"
        )
    );

    void m.react("✅");
    void m.react("❌");
  },
});