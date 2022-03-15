import { knex } from "../index";
import { Model } from ".";
import { environment } from "../../config";

export interface SpotifyPlaylistSchema {
  spotifyId: string;
  name: string;
}

export const urlBase = "https://open.spotify.com/playlist/";
export const urlRegex =
  /^(https:\/\/open.spotify.com\/playlist\/)([a-zA-Z0-9]+)\?si=(.*)$/;

class SpotifyPlaylistModel extends Model<SpotifyPlaylistSchema> {
  tableName = "spotifyPlaylists";

  public url({ spotifyId }: { spotifyId: string }) {
    return `${urlBase}${spotifyId}`;
  }

  public id(url: string) {
    const match = urlRegex.exec(url);
    if (!match) return "";
    return match[2];
  }

  public async select(param: {
    id?: number;
    spotifyId?: string;
    name?: string;
  }) {
    const query = { ...param };
    return (await knex
      .from(this.tableName)
      .where(query)) as SpotifyPlaylistSchema[];
  }

  public async insert(param: SpotifyPlaylistSchema) {
    // check if spotifyId already exists
    const existing = await this.select(param);
    if (existing.length > 0) {
      throw new Error("Duplicate record");
    }

    let spotifyPlaylists = await knex
      .from(this.tableName)
      .insert(param, ["id", "spotifyId", "name"]);

    if (spotifyPlaylists.length <= 0) {
      throw new Error("Insert spotifyPlaylist");
    }

    if (environment !== "production") {
      // insert returns the id in sqlite
      const sqliteId = spotifyPlaylists[0] as number;
      spotifyPlaylists = await this.select({ id: sqliteId });
    }

    return spotifyPlaylists[0] as SpotifyPlaylistSchema;
  }

  public async update(
    where: {
      id?: number;
      spotifyId?: string;
      name?: string;
    },
    param: SpotifyPlaylistSchema
  ) {
    const query = { ...param };
    let updated = (await knex
      .from(this.tableName)
      .where(where)
      .update(query, ["id", "spotifyId", "name"])) as SpotifyPlaylistSchema[];

    if (environment !== "production") {
      // update returns boolean in sqlite
      if (updated) {
        updated = await this.select(param);
      } else {
        updated = [];
      }
    }

    if (updated.length === 0) throw new Error("Not found");

    return updated;
  }

  public async delete(param: {
    id?: number;
    spotifyId?: string;
    name?: string;
  }) {
    return (await knex.from(this.tableName).where(param).del()) as number;
  }
}

export const SpotifyPlaylist = new SpotifyPlaylistModel();
