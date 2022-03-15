import knexConfig from "./knexfile";
import knex from "knex";

import { environment } from "../config";

const ourKnex = knex(knexConfig[environment]);

export { ourKnex as knex };

export const DB = {
  USERS: "users",
};
