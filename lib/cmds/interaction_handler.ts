import { createLogger } from "@utils/logger";

import { Interaction } from "discord.js";

import { CommandContext } from "./command_context";

const log = createLogger("cmds.interaction_handler");

// Don't use the event context, we don't want to become x-module dependent.
interface HandleOpts {
  interaction: Interaction;
}

export function handle({ interaction }: HandleOpts) {
  if (!interaction.isCommand()) return;

  const { command } = interaction;
  if (command === null) return;

  const ctx = {
    interaction,
    log: log.child(command.name),
  } as CommandContext;

  return ctx;
}
