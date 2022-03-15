import { knex } from "../index";
import { Model } from ".";
import { environment } from "../../config";

interface BaseSchema {
  id?: number;
  name?: string;
  location?: string;
  time?: string;
  description?: string;
}

export interface ShowSchema {
  id?: number;
  name: string;
  location?: string;
  date?: Date;
  time?: string;
  description?: string;
}

interface QuerySchema extends BaseSchema {
  date?: Date;
}

interface DbSchema extends BaseSchema {
  date?: string;
}

function date2string(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function string2date(date: string) {
  const nums = date.split("/");
  const d = new Date(`${nums[1]}/${nums[0]}/${nums[2]}`);
  d.setHours(d.getHours() + 6);
  return d;
}

function dbParam(param: QuerySchema): DbSchema {
  let result: DbSchema = {};
  if (param.id) result.id = param.id;
  if (param.name) result.name = param.name;
  if (param.location) result.location = param.location;
  if (param.date) result.date = date2string(param.date);
  if (param.time) result.time = param.time;
  if (param.description) result.description = param.description;
  return result;
}

function dbResult(param: DbSchema): QuerySchema {
  return {
    id: param.id,
    name: param.name,
    location: param.location,
    date: param.date ? string2date(param.date) : undefined,
    time: param.time,
    description: param.description,
  };
}

class ShowModel extends Model<ShowSchema> {
  tableName = "shows";

  public async select(param: QuerySchema) {
    const query = dbParam(param);
    const selected = (await knex
      .from(this.tableName)
      .where(query)) as DbSchema[];
    return selected.map((s: DbSchema) => dbResult(s)) as ShowSchema[];
  }

  public async insert(param: ShowSchema) {
    const newShow = dbParam(param);
    let shows = await knex
      .from(this.tableName)
      .insert(newShow, [
        "id",
        "date",
        "time",
        "location",
        "name",
        "description",
      ]);

    if (shows.length <= 0) {
      throw new Error("Insert shows");
    }

    if (environment !== "production") {
      // insert returns the id in sqlite
      const sqliteId = shows[0] as number;
      shows = await this.select({ id: sqliteId });
    }

    const show = shows[0] as DbSchema;

    return show as ShowSchema;
  }

  public async update(where: QuerySchema, param: ShowSchema) {
    const query = dbParam(where);
    let updated = (await knex
      .from(this.tableName)
      .where(where)
      .update(query)) as DbSchema[];

    if (environment !== "production") {
      // update returns boolean in sqlite
      if (updated) {
        updated = (await this.select(param)).map((p) => dbParam(p));
      } else {
        updated = [];
      }
    }

    if (updated.length === 0) throw new Error("Not found");

    return updated.map((u) => dbResult(u)) as ShowSchema[];
  }

  public async delete(param: { id: number }) {
    return (await knex.from(this.tableName).where(param).del()) as number;
  }
}

export const Show = new ShowModel();
