import "reflect-metadata";
import "./register_aliases";

import { config as dotenv } from "dotenv";

dotenv();

import { bootstrap } from "./bootstrap";

void bootstrap();
