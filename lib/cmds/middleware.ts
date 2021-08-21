import { Asyncable } from "@utils/types";

import { CommandContext } from "./command_context";

export type NextFn = (err?: Error) => void;

export type Middleware<A> = (
  ctx: CommandContext<A>,
  next: NextFn
) => Asyncable<void>;
