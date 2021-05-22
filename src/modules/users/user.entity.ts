import { addEntity } from "@db/entities";

import { Snowflake } from "discord.js";
import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryColumn()
  public id!: Snowflake;
}

addEntity(User);
