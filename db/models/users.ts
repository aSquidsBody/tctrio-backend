import { environment } from "../../config";
import { knex } from "../index";
import { Model } from ".";
import { Password } from "../../services/password";

export interface UserSchema {
  id: number;
  username: string;
  password: string;
  email: string;
  admin: boolean;
}

export interface UserSchemaNoPassword {
  id: number;
  username: string;
  email: string;
  admin: boolean;
}

class UserModel extends Model<UserSchema> {
  tableName = "users";

  public async select(param: {
    id?: number;
    username?: string;
    email?: string;
    admin?: boolean;
  }) {
    const query = { ...param };
    return (await knex.from(this.tableName).where(query)) as UserSchema[];
  }

  public async insert(param: {
    username: string;
    email: string;
    password: string;
    admin: boolean;
  }) {
    // hash the password
    param.password = await Password.toHash(param.password);

    let users = await knex
      .from(this.tableName)
      .insert(param, ["id", "username", "email"]);

    if (users.length <= 0) {
      throw new Error("insert new user");
    }

    if (environment !== "production") {
      // insert returns the id in sqlite
      const sqliteId = users[0] as number;
      users = await this.select({ id: sqliteId });
    }

    return users[0] as UserSchema;
  }

  public async update(
    where: {
      id?: number;
      username?: string;
      email?: string;
    },
    param: {
      username?: string;
      email?: string;
      password?: string;
      admin?: boolean;
    }
  ) {
    const query = { ...param };
    let updated = (await knex
      .from(this.tableName)
      .where(where)
      .update(query)) as UserSchema[];

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
    username?: string;
    email?: string;
  }) {
    return (await knex.from(this.tableName).where(param).del()) as number;
  }

  // validate the password of a user (true if valid; false otherwise)
  public async validatePassword(username: string, password: string) {
    const existingUsers = await this.select({ username });

    if (existingUsers.length > 1) {
      console.error("Multiple users returned in validate", username);
      throw new Error("Internal server error (validate)");
    }

    if (
      existingUsers.length === 0 ||
      !(await Password.compare(existingUsers[0].password, password))
    ) {
      return false;
    }

    return true;
  }
}

export const User = new UserModel();
