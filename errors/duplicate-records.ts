import { CustomError } from "./custom-error";

export class DuplicateRecordError extends CustomError {
  statusCode = 409;

  constructor(public message: string, public field: string) {
    super(message);

    Object.setPrototypeOf(this, DuplicateRecordError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message, field: this.field }];
  }
}
