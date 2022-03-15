import { knex } from "../index";
import { Model } from ".";
import { environment } from "../../config";

export interface TextSchema {
  text: string;
  name: string;
}

class TextModel extends Model<TextSchema> {
  tableName = "text";

  public async select(param: { id?: number; name?: string }) {
    const query = { ...param };
    return (await knex.from(this.tableName).where(query)) as TextSchema[];
  }

  public async insert(param: TextSchema) {
    // check if name already exists
    const existingText = await this.select({
      name: param.name,
    });
    if (existingText.length > 0) {
      throw new Error("Duplicate record");
    }

    let texts = await knex
      .from(this.tableName)
      .insert(param, ["id", "name", "text"]);

    if (texts.length <= 0) {
      throw new Error("Insert text");
    }

    if (environment !== "production") {
      // insert returns the id in sqlite
      const sqliteId = texts[0] as number;
      texts = await this.select({ id: sqliteId });
    }

    return texts[0] as TextSchema;
  }

  public async update(
    where: {
      id?: number;
      name?: string;
    },
    param: TextSchema
  ) {
    const query = { ...param };
    let updated = (await knex
      .from(this.tableName)
      .where(where)
      .update(query)) as TextSchema[];

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

  public async delete(param: { id?: number; name: string }) {
    return (await knex.from(this.tableName).where(param).del()) as number;
  }
}

export const Text = new TextModel();
