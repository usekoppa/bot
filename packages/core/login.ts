import { KoppaClient } from "@core/client";
import { config } from "@utils/config";

import { Container } from "typedi";

const client = Container.get(KoppaClient);

void client.login(config.bot.token);