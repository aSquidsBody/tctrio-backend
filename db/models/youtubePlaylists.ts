import { knex } from "../index";
import { Model } from ".";
import { environment } from "../../config";

export interface YoutubePlaylistSchema {
  youtubeId: string;
  name: string;
}

export const urlBase = "https://www.youtube.com/playlist?list=";
export const urlRegex = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;

class YoutubePlaylistModel extends Model<YoutubePlaylistSchema> {
  tableName = "youtubePlaylists";

  public url({ youtubeId }: { youtubeId: string }) {
    return `${urlBase}${youtubeId}`;
  }

  public id(url: string) {
    const match = urlRegex.exec(url);
    if (!match) return "";
    return match[2];
  }

  public async select(param: {
    id?: number;
    youtubeId?: string;
    name?: string;
  }) {
    const query = { ...param };
    return (await knex
      .from(this.tableName)
      .where(query)) as YoutubePlaylistSchema[];
  }

  public async insert(param: YoutubePlaylistSchema) {
    // check if youtubeId already exists
    const existing = await this.select(param);
    if (existing.length > 0) {
      throw new Error("Duplicate record");
    }

    let youtubePlaylists = await knex
      .from(this.tableName)
      .insert(param, ["id", "youtubeId", "name"]);

    if (youtubePlaylists.length <= 0) {
      throw new Error("Insert youtubePlaylist");
    }

    if (environment !== "production") {
      // insert returns the id in sqlite
      const sqliteId = youtubePlaylists[0] as number;
      youtubePlaylists = await this.select({ id: sqliteId });
    }

    return youtubePlaylists[0] as YoutubePlaylistSchema;
  }

  public async update(
    where: {
      id?: number;
      youtubeId?: string;
      name?: string;
    },
    param: YoutubePlaylistSchema
  ) {
    const query = { ...param };
    let updated = (await knex
      .from(this.tableName)
      .where(where)
      .update(query, ["id", "youtubeId", "name"])) as YoutubePlaylistSchema[];

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
    youtubeId?: string;
    name?: string;
  }) {
    return (await knex.from(this.tableName).where(param).del()) as number;
  }
}

export const YoutubePlaylist = new YoutubePlaylistModel();
