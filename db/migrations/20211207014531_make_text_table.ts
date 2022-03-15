import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("text", function (table) {
    table.increments("id");
    table.string("name", 255).notNullable();
    table.string("text", 10_000);
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {}
