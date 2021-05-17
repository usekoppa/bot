import "reflect-metadata";
import "./register_aliases";

import { config } from "dotenv";

config();

import { bootstrap } from "./bootstrap";

void bootstrap();
