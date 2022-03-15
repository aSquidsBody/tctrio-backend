import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { InternalServerError } from "../errors/internal-server-error";

interface UserPayload {
  id: number;
  email: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.cookies.x2f01) {
    return next();
  }

  if (!process.env.JWT_KEY) {
    console.error("no jwt key");
    throw new InternalServerError("Internal server error");
  }

  try {
    const payload = jwt.verify(
      req.cookies.x2f01.jwt,
      process.env.JWT_KEY
    ) as UserPayload;
    req.currentUser = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };
  } catch (err) {}

  next();
};
