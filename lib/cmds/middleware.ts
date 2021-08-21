import { Asyncable } from "@utils/types";

import { CommandContext } from "./command_context";

export type Middleware<A> = (ctx: CommandContext<A>) => Asyncable<void>;
