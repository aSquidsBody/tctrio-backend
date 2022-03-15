import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("shows", function (table) {
    table.increments("id");
    table.string("date");
    table.string("time");
    table.string("location");
    table.string("name").notNullable();
    table.string("description");

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {}
