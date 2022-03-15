export abstract class Model<T> {
  public abstract tableName: string;

  abstract select(param: any): Promise<T[]>;

  abstract insert(param: T): Promise<T>;

  abstract update(where: any, param: any): Promise<T[]>;

  abstract delete(param: any): Promise<number>;
}
