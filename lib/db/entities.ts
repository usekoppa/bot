import { EntitySchema } from "typeorm";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
type AnyEntity = Function | string | EntitySchema<any>;

const entities: AnyEntity[] = [];

export function addEntity(entity: AnyEntity) {
  entities.push(entity);
}

export function getEntities() {
  return entities;
}
