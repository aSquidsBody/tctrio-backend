import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", function (table) {
    table.increments("id");
    table.string("username", 255).notNullable();
    table.string("email", 255);
    table.string("password", 255);
    table.boolean("admin");
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {}
