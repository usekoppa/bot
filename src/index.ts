import "reflect-metadata";

import { config as dotenv } from "dotenv";

dotenv();

import "./register_aliases";

import { bootstrap } from "./bootstrap";

void bootstrap();
