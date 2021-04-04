import "reflect-metadata";
import "./lib/utils/register_aliases";

import { config } from "dotenv";

import { bootstrap } from "./bootstrap";

config();

void bootstrap();
