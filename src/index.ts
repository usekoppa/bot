import "reflect-metadata";
import "./register_aliases";

import { config } from "dotenv";

import { bootstrap } from "./bootstrap";

config();

void bootstrap();
