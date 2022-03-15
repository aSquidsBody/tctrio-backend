import knexConfig from "./knexfile";
import knex from "knex";

type Enviroment = "development" | "staging" | "production";

const envType = (process.env.DB_ENV as Enviroment) || "development";
const ourKnex = knex(knexConfig[envType]);

ourKnex.migrate
  .latest({ directory: "./db/migrations" })
  .then(() => {
    console.log("MIGRATIONS DONE");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit();
  });
