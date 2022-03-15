import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("spotifyPlaylists", function (table) {
    table.increments("id");
    table.string("spotifyId", 255).notNullable();
    table.string("name").notNullable();
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {}
